const express = require('express')
const csrf = require("tiny-csrf");
const app = express();
const path = require("path");
const cookieParser = require('cookie-parser');
app.use(cookieParser("cookie-parser-secret"));
// app.use(session({ secret: "keyboard cat" }));
app.use(
  csrf(
    "123456789iamasecret987654321look", // secret -- must be 32 bits or chars in length
    ["POST", "PUT", "DELETE"],
  )
);

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
app.get('/', async (req, res) => {
  if (req.accepts("html")) {
    res.render("index",
      {
        title: "Sports Scheduler",
      })
  }
})
app.get('/home', async (req, res) => {
  if (req.accepts("html")) {
    res.render("home",
      {
        title: "Home",
      })
  }
})

app.get('/signup', async (req, res) => {
  if (req.accepts("html")) {
    res.render("signup",
      {
        title: "Sign Up",
        csrfToken: req.csrfToken()
      })
  }
})

app.get('/login', async (req, res) => {
  if (req.accepts("html")) {
    res.render("login",
      {
        title: "Login",
        csrfToken: req.csrfToken()
      })
  }
})

module.exports = app;
