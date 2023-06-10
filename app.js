const express = require("express");
const csrf = require("tiny-csrf");
const app = express();
const { User, sports, sessions } = require("./models");
const LocalStrategy = require("passport-local");
const connectEnsureLogin = require("connect-ensure-login");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const flash = require("connect-flash");
const path = require("path");
const { format, parseISO } = require('date-fns');
const session = require("express-session");
const cookieParser = require("cookie-parser");
const { formatDate } = require("./helper/formatDate")
app.use(cookieParser("cookie-parser-secret"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
const passport = require("passport");
app.use(
  session({
    secret: "keyboard cat",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // a week
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(
  csrf(
    "123456789iamasecret987654321look", // secret -- must be 32 bits or chars in length
    ["POST", "PUT", "DELETE"]
  )
);
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      return done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (email, password, done) => {
      User.findOne({ where: { email: email } })
        .then(async (user) => {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch(() => {
          return done(null, false, { message: "User doesn't exist" });
        });
    }
  )
);
function requirePublisher(req, res, next) {
  if (req.user && req.user.role === "admin") {
    return next();
  } else {
    res.status(401).json({ message: "Unauthorized user." });
  }
}

app.get("/", async (req, res) => {
  if (req.user) {
    res.redirect("/sports");
  } else {
    if (req.accepts("html")) {
      res.render("index", {
        title: "Sports Scheduler",
        csrfToken: req.csrfToken(),
      });
    } else {
      res.json({ message: "Welcome to the sports scheduler." });
    }
  }
});

app.get("/signup", async (req, res) => {
  if (req.user) {
    res.redirect("/sports");
  } else {
    res.render("signup", {
      title: "Sign Up",
      csrfToken: req.csrfToken(),
    });
  }
});

app.post("/users", async (req, res) => {
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds);
  console.log(hashedPwd);
  console.log(`userName ${req.body.userName}`);

  if (req.body.userName == "") {
    req.flash("error", "Name is required");
    return res.redirect("/signup");
  }
  if (req.body.email == "") {
    req.flash("error", "email is required");
    return res.redirect("/signup");
  }
  if (req.body.password.length < 8) {
    req.flash("error", "password atleast of 8 character");
    return res.redirect("/signup");
  }
  try {
    const user = await User.create({
      userName: req.body.userName,
      email: req.body.email,
      password: hashedPwd,
      role: req.body.role,
    });
    req.login(user, (err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/sports");
    });
  } catch (error) {
    console.error(error);
    req.flash("error", "Email already exist");
    return res.redirect("/signup");
  }
});
app.get("/login", async (req, res) => {
  if (req.user) {
    res.redirect("/sports");
  } else {
    res.render("login", {
      title: "Login",
      csrfToken: req.csrfToken(),
    });
  }
});
app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (req, res) => {
    res.redirect("/sports");
  }
);
app.get("/signout", async (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/");
  });
});

app.get("/sports", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  const account = await User.findByPk(req.user.id);
  const username = `${account.userName}`;
  const sports_list = await sports.allsports();
  console.log(username);
  console.log(account.role);
  if (req.accepts("html")) {
    res.render("home", {
      title: "Home",
      username,
      role: account.role,
      csrfToken: req.csrfToken(),
      sports_list,
    });
  } else {
    res.json({ message: "Welcome to the sports scheduler." });
  }
});
app.get(
  "/sports/new_sport",
  connectEnsureLogin.ensureLoggedIn(),
  requirePublisher,
  async (req, res) => {
    res.render("newSport", {
      title: "New Sports",
      csrfToken: req.csrfToken(),
    });
  }
);

app.post(
  "/new",
  connectEnsureLogin.ensureLoggedIn(),
  requirePublisher,
  async (req, res) => {
    if (req.body.Sports === "") {
      req.flash("error", "sports cannot be empty");
      return res.redirect("/sports/new_sport");
    }
    try {
      const sport = await sports.addsport({
        sports_name: req.body.Sports,
        userId: req.user.id,
      });
      console.log(sport.sports_name);
      res.redirect("/sports");
    } catch (error) {
      req.flash("error", "sport already exist");
      console.log(error);
    }
  }
);
app.get(
  "/sports/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    try {
      const account = await User.findByPk(req.user.id);
      const role = await account.role;
      const sport = await sports.findByPk(req.params.id);
      const upcoming_session = await sessions.upcomingSession(req.params.id)
      const sport_name = sport.sports_name;
      res.render("sport", {
        title: sport_name,
        role,
        sportId: req.params.id,
        upcoming_session,
        csrfToken: req.csrfToken()
      });
    }
    catch (err) {
      console.error(err)
  }}
);
app.get(
  "/sports/:sportId/edit",
  connectEnsureLogin.ensureLoggedIn(),
  requirePublisher,
  async (req, res) => {
    try {
      const sport = await sports.findByPk(req.params.sportId)
      res.render("sportedit", {
        title: "sport edit",
        csrfToken: req.csrfToken(),
        sportId: req.params.sportId,
        sportName: sport.sports_name
      });
    }
    catch (error) {
      console.error(error)
    }
  }
);
app.post(
  "/sports/:id/edit",
  connectEnsureLogin.ensureLoggedIn(),
  requirePublisher,
  async (req, res) => {
    try {
      await sports.editSport(req.params.id, req.body.EditSport);
      res.redirect("/sports");
    } catch (error) {
      console.log(error);
    }
  }
);
app.post(
  "/sports/:id/delete",
  connectEnsureLogin.ensureLoggedIn(),
  requirePublisher,
  async (req, res) => {
    try {
      await sports.deleteSport(req.params.id);
      res.redirect("/sports");
    } catch (error) {
      console.log(error);
    }
  }
);
app.get(
  "/sports/:id/new_session",
  connectEnsureLogin.ensureLoggedIn(),
  async (req, res) => {
    const sport = await sports.findByPk(req.params.id);
    const sport_name = sport.sports_name;
    const sport_id = req.params.id;
    console.log(`the value of sports id ${req.params.id}`);
    try {
      res.render("new_session", {
        title: "New Session",
        csrfToken: req.csrfToken(),
        sport_name,
        sport_id,
      });
    } catch (error) {
      console.log(error);
    }
  }
);
app.post('/session', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  console.log(req.body.sport_id);
  if (req.body.Date == "Invalid date") {
    req.flash("error", "Invalid date");
    return res.redirect(`/sports/${req.body.sport_id}/new_session`);
  }
  if (req.body.address == "") {
    req.flash("error", "address is required");
    return res.redirect(`/sports/${req.body.sport_id}/new_session`);
  }
  if (req.body.players == "") {
    req.flash("error", "atleast one player name is required");
    return res.redirect(`/sports/${req.body.sport_id}/new_session`);
  }
  if (req.body.needed_player == "") {
    req.flash("error", "Number of players required");
    return res.redirect(`/sports/${req.body.sport_id}/new_session`);
  }
  try {
    const session = await sessions.addsession({
      date: req.body.Date,
      address: req.body.address,
      player: req.body.players,
      needed: req.body.needed_player,
      sportId: req.body.sport_id,
      userId: req.user.id,
    });
    console.log(JSON.stringify(session, null, 2));
    res.redirect(`/sessions/${session.id}`);
  } catch (error) {
    console.log(error);
  }
  });
  app.get('/sports/:sportId/previous_sessions', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
    const sport = await sports.findByPk(req.params.sportId)
    const sportName = sport.sports_name 
    const previous_sessions = await sessions.previousSession(req.params.sportId)
    try {
      res.render("previousSessions", {
        title: "Previous Sessions",
        csrfToken: req.csrfToken(),
        sportName,
        previous_sessions
      })
    }
    catch (error) {
      console.error(error)
    }
  })
  app.get(
    "/sessions/:id",
    connectEnsureLogin.ensureLoggedIn(),
    async (req, res) => {
      const session = await sessions.findByPk(req.params.id);
      const sportid = session.sportId;
      const sport = await sports.findByPk(sportid);
      const sport_name = sport.sports_name;
      console.log(sport_name);
      const details = await sessions.getsession(req.params.id);
      const formattedDate = formatDate(details.date);
      try {
        res.render("sessions", {
          title: "sessions",
          csrfToken: req.csrfToken(),
          sportName: sport_name,
          sessionId: req.params.id,
          userId: req.user.id,
          details,
          formattedDate
        });
      } catch (error) {
        console.log(error);
      }
    });
app.get("/sessions/:sessionId/cancelSession", connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const session = await sessions.findByPk(req.params.sessionId)
    if (session.userId === req.user.id && session.status === 'onboard') {
      res.render("cancelSession", {
        title: "cancel session",
        csrfToken: req.csrfToken(),
        sessionId: req.params.sessionId,
        })
    }
    else {
      res.status(401).send( "Unauthorized user.");
    }
  }
  catch (error) {
    console.error(error)
    res.status(500).send("An error occurred");
  }
})
app.post('/sessions/:sessionId/cancelSession',connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sessionId = req.params.sessionId
    const reason = req.body.cancelreason
    const session = await sessions.findByPk(sessionId)
    await sessions.cancelSession(sessionId, reason)
    res.redirect(`/sports/${session.sportId}`)   
  }
  catch (error) {
    console.error(error)
    res.status(500).send("An error occurred");
  }
})
app.post('/sessions/:session/joinsession', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {
  try {
    const sessionId = req.params.session;
    const session = await sessions.findByPk(sessionId);
    const user = await User.findByPk(req.user.id);

    if (session.status === "onboard") {
      if (session.date >= new Date()) {
        console.log(user.userName)
        await sessions.joinSession(sessionId, user.userName)
        // Redirect or send response as needed
        res.redirect(`/sessions/${session.id}`);
      } else {
        console.error("Unable to join previous sessions");
        res.status(400).send("Unable to join previous sessions");
      }
    } else {
      console.error("Cancelled sessions cannot be joined");
      res.status(400).send("Cancelled sessions cannot be joined");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});
module.exports = app;
