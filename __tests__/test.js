/* eslint-disable no-undef */
const request = require("supertest");
const db = require("../models/index");
const app = require("../app");
const { sports, User, sessions } = require("../models");
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
    server = app.listen(4000, () => {});
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
    const createdTest = await sports.findOne({
      where: { sports_name: "Football" },
    });
    id = createdTest.id; // Assuming the ID property is named 'id'
    res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    await agent.get("/signout");
  });

  test("Player Trying to create Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/sports/new_sport");
    expect(res.statusCode).toBe(401);
    await agent.get("/signout");
  });

  test("Player can access sports", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    await agent.get("/signout");
  });
  test("Admin edit sport", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    res = await agent.get(`/sports/${id}/edit`);
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/sports/${id}/edit`).send({
      _csrf: csrfToken,
      EditSport: "backetball",
    });
    expect(res.statusCode).toBe(302);
    const updated = await sports.findOne({
      where: { id: id },
    });
    expect(updated.sports_name).toBe("backetball");
  });

  test("Player try to edit sport", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}`);
    expect(res.statusCode).toBe(200);
    res = await agent.get(`/sports/${id}/edit`);
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(401);
    res = await agent.post(`/sports/${id}/edit`).send({
      _csrf: csrfToken,
      EditSport: "tabletennis",
    });
    expect(res.statusCode).toBe(500);
  });

  test("Admin can delete sport", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    let res = await agent.get("/sports/new_sport");
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
    let sportid = createdTest.id;
    res = await agent.get(`/sports/${sportid}`);
    csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/sports/${sportid}/delete`).send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Player try to delete sport", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}`);
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/sports/${id}/delete`).send({
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(500);
  });
  test("Admin can create sports session", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}/new_session`);
    let csrfToken = extractCsrfToken(res);
    const createdTest = await User.findOne({
      where: { email: "admin@gmail.com" },
    });
    let userid = createdTest.id;
    expect(res.statusCode).toBe(200);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    res = await agent.post(`/session`).send({
      _csrf: csrfToken,
      Date: tomorrow.toISOString(),
      address: "address for test",
      players: "raju,ram,shayam",
      needed_player: 2,
      sport_id: id,
      userId: userid,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Player can create sports session", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get(`/sports/${id}/new_session`);
    let csrfToken = extractCsrfToken(res);
    const createdTest = await User.findOne({
      where: { email: "player@gmail.com" },
    });
    let userid = createdTest.id;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/session`).send({
      _csrf: csrfToken,
      Date: tomorrow.toISOString(),
      address: "address for test",
      players: "raju,ram,shayam",
      needed_player: 2,
      sport_id: id,
      userId: userid,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Player can cancel there created session with a reason", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    const user = await User.findOne({
      where: {
        email: "player@gmail.com",
      },
    });
    const userid = user.id;
    const session = await sessions.findOne({
      where: {
        userId: userid,
      },
    });
    let res = await agent.get(`/sessions/${session.id}/cancelSession`);
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/sessions/${session.id}/cancelSession`).send({
      cancelreason: "there is an emergency",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("admin can cancel there created session with a reason", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");
    const user = await User.findOne({
      where: {
        email: "admin@gmail.com",
      },
    });
    const userid = user.id;
    const session = await sessions.findOne({
      where: {
        userId: userid,
      },
    });
    let res = await agent.get(`/sessions/${session.id}/cancelSession`);
    let csrfToken = extractCsrfToken(res);
    expect(res.statusCode).toBe(200);
    res = await agent.post(`/sessions/${session.id}/cancelSession`).send({
      cancelreason: "there is an emergency",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });
  test("Admin Join session", async () => {
    const agent = request.agent(server);
    await login(agent, "admin@gmail.com", "12345678");

    // Find the session based on specific criteria
    const session = await sessions.findOne({
      where: {
        status: "onboard",
        date: { [db.Sequelize.Op.gte]: new Date() },
        needed: { [db.Sequelize.Op.gte]: 1 },
      },
      order: [["date", "ASC"]],
    });

    if (session) {
      const session_id = session.id;
      console.log(session_id);

      try {
        let res = await agent.post(`/session/${session_id}/joinsession`);
        expect(res.statusCode).toBe(200);
      } catch (error) {
        console.error("Error joining session:", error);
        throw error;
      }
    } else {
      console.error("No eligible sessions found");
    }
  });
  test("Player can Join session", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");

    // Find the session based on specific criteria
    const session = await sessions.findOne({
      where: {
        status: "onboard",
        date: { [db.Sequelize.Op.gte]: new Date() },
        needed: { [db.Sequelize.Op.gte]: 1 },
      },
      order: [["date", "ASC"]],
    });

    if (session) {
      const session_id = session.id;
      console.log(session_id);

      try {
        let res = await agent.post(`/session/${session_id}/joinsession`);
        expect(res.statusCode).toBe(200);
      } catch (error) {
        console.error("Error joining session:", error);
        throw error;
      }
    } else {
      console.error("No eligible sessions found");
    }
  });
  test("changing the password", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get("/updatepassword");
    expect(res.statusCode).toBe(200);
    let csrfToken = extractCsrfToken(res);
    res = await agent.post("/updatepassword").send({
      _csrf: csrfToken,
      currentPassword: "12345678",
      updatePassword: "87654321",
      confirmPassword: "87654321",
    });
    expect(res.statusCode).toBe(302);
  });
});
