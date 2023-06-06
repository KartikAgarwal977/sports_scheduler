const request = require('supertest')
const db = require('../models/index')
const app = require('../app')
const cheerio = require('cheerio');
let server, agent;
function extractCsrfToken(res) {
    const $ = cheerio.load(res.text);
    return $('input[name=_csrf]').val();
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
        console.log(csrfToken + " csrftoken");
        res = await agent.post("/users").send({
          _csrf: csrfToken,
          userName: 'admin',
          email: "admin@gmail.com",
          password: "12345678",
          role: 'admin'
        })
        .withCredentials();
        console.log(res.text);
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
        console.log(csrfToken + " csrftoken");
        res = await agent.post("/users").send({
          _csrf: csrfToken,
          userName: 'Player',
          email: "player@gmail.com",
          password: "12345678",
          role: 'player'
        })
        .withCredentials();
        console.log(res.text);
        expect(res.statusCode).toBe(302);
      });
    test("sign out as player", async () => {
        let res = await agent.get("/sports");
        expect(res.statusCode).toBe(200);
        res = await agent.get("/signout");
        expect(res.status).toBe(302);
        res = await agent.get("/sports");
        expect(res.status).toBe(302);
    })

    test("Admin Sport creating", async () => {
        const agent = request.agent(server);
        await login(agent, "admin@gmail.com", "12345678");
        let res = await agent.get("/sports");
        expect(res.statusCode).toBe(200);
        res = await agent.get('/sports/new')
        let csrfToken = extractCsrfToken(res)
        expect(res.statusCode).toBe(200)
        res = await agent.post('/new').send({
            _csrf: csrfToken,
            sportName: "Football",
        })
        expect(res.statusCode).toBe(302)    
        await agent.get("/sigout")
    })
  
  test("Player Trying to create Sport", async () => {
    const agent = request.agent(server);
    await login(agent, "player@gmail.com", "12345678");
    let res = await agent.get("/sports");
    expect(res.statusCode).toBe(200);
    res = await agent.get('/sports/new')
    expect(res.statusCode).toBe(401);
  })
  
})  

