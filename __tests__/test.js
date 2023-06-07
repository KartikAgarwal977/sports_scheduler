const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const { sports, User } = require("../models");
const cheerio = require("cheerio");
let server, agent;
function extractCsrfToken(res) {
  const $ = cheerio.load(res.text);
  return $("input[name=_csrf]").val();
}
const login = async (agent, Email, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/login").send({
    email: Email,
    password: password,
    _csrf: csrfToken,
  });
};
let id;
describe("Sports Schedular Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => { });
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });
  test("Sign up as Admin", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent
      .post("/users")
      .send({
        _csrf: csrfToken,
        userName: "admin",
        email: "admin@gmail.com",
        password: "12345678",
        role: "admin",
      })
      .withCredentials();
    expect(res.statusCode).toBe(302);
  });
  test("Sign out ", async () => {
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.status).toBe(302);
    res = await agent.get("/sports");
    expect(res.status).toBe(302);
  });
  test("Sign up as player", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent
      .post("/users")
      .send({
        _csrf: csrfToken,
        userName: "Player",
        email: "player@gmail.com",
        password: "12345678",
        role: "player",
      })
      .withCredentials();
    expect(res.statusCode).toBe(302);
  });
  test("sign out as player", async () => {
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.status).toBe(302);
    res = await agent.get("/sports");
    expect(res.status).toBe(302);
  });

  test("Admin Sport creating", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/sports/new_sport");
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post("/new").send({
      _csrf: csrfToken,
      Sports: "Football",
    });
    expect(res.statusCode).toBe(302);
    await agent.get("/sigout");
  });

  test("Player Trying to create Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/sports/new_sport");
    expect(res.statusCode).toBe(401);
    await agent.get("/sigout");
  });

  test("Admin add sports", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    res = await agent.get("/sports/new_sport");
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post("/new").send({
      _csrf: csrfToken,
      Sports: "Cricket",
    });
    expect(res.statusCode).toBe(302);
    const createdTest = await sports.findOne({
      where: { sports_name: "Cricket" },
    });
    id = createdTest.id; // Assuming the ID property is named 'id'
    res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    await agent.get("/sigout");
  });

  test("Player can access sports", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    await agent.get("/sigout");
  });

  test("Admin can create sports session", async () => {
    const agent = request.agent(server);
    await login(agent, 'admin@gmail.com', '12345678')
    let res = await agent.get(`/sports/${id}/new_session`)
    let csrfToken = extractCsrfToken(res);
    const createdTest = await User.findOne({
      where: { email: "admin@gmail.com" },
    });
    let userid = createdTest.id;
    expect(res.statusCode).toBe(200)
    res = await agent.post(`/session`).send({
      _csrf: csrfToken,
      Date: new Date().toISOString(),
      address: "address for test",
      players: "raju,ram,shayam",
      needed_player: 2,
      sport_id: id,
      userId: userid
    })
    expect(res.statusCode).toBe(302)
  });
  test("Player can create sports session", async () => {
    const agent = request.agent(server);
    await login(agent, 'player@gmail.com', '12345678')
    let res = await agent.get(`/sports/${id}/new_session`)
    let csrfToken = extractCsrfToken(res);
    const createdTest = await User.findOne({
      where: { email: "player@gmail.com" },
    });
    let userid = createdTest.id;
    expect(res.statusCode).toBe(200)
    res = await agent.post(`/session`).send({
      _csrf: csrfToken,
      Date: new Date().toISOString(),
      address: "address for test",
      players: "raju,ram,shayam",
      needed_player: 2,
      sport_id: id,
      userId: userid
    })
    expect(res.statusCode).toBe(302)
  });
});
