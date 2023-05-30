const express = require('express')
const csrf = require("tiny-csrf");
const app = express();
const {User} = require('./models')
const LocalStrategy = require("passport-local")
const connectEnsureLogin = require('connect-ensure-login');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const flash = require("connect-flash");
const path = require("path");
const session = require('express-session');
const cookieParser = require('cookie-parser');
app.use(cookieParser("cookie-parser-secret"));
app.use(express.urlencoded({ extended: false }));
app.use(flash())
const passport = require('passport');
app.use(session({
  secret: "keyboard cat",
  cookie: {
  maxAge: 1000 * 60 * 60 * 24 * 7// a week
  }
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(
  csrf(
    "123456789iamasecret987654321look", // secret -- must be 32 bits or chars in length
    ["POST", "PUT", "DELETE"],
  )
);
app.use(function(request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.set('view engine', 'ejs');
app.set("views", path.join(__dirname, "views"));
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      return done(null, user)
    })
    .catch((error) => {
      done(error, null)
    })
  })

passport.use(new LocalStrategy({
  usernameField: "Email",
  passwordField: "password"
}, (email, password, done) => {
  User.findOne({ where: { email: email } })
    .then(async(user) => {
      const result = await bcrypt.compare(password, user.password)
      if (result) {
        return done(null, user)
      }
      else {
        return done(null, false, { message :"Invalid Password"});
        }
    }).catch(() => {
      return done(null,false, {message: "User doesn't exist"})
    }) 
}))
function requirePublisher(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    return next();
  } else {
    res.status(401).json({ message: 'Unauthorized user.' });
  }
}


app.get('/', async (req, res) => {
  if (req.accepts("html")) {
    res.render("index",
      {
        title: "Sports Scheduler",
        csrfToken: req.csrfToken()
      })
  }
  else {
    res.json({ message: "Welcome to the sports scheduler." })
    }
})

app.get('/sports', connectEnsureLogin.ensureLoggedIn(), async (req, res) => {

  const account = await User.findByPk(req.user.id)
  const username = `${account.firstName} ${account.lastName}`
  console.log(username)
  console.log(account.role)
  if (req.accepts("html")) {
    res.render("home",
      {
        title: "Home",
        username,
        role: account.role,
        csrfToken: req.csrfToken()
      })
  }
  else {
    res.json({ message: "Welcome to the sports scheduler." })
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
  else {
    res.json({ message: "sign up page" })
    }
})

app.post('/users', async (req, res) => {
  const hashedPwd = await bcrypt.hash(req.body.password, saltRounds)
  console.log(hashedPwd)
  console.log(`firstName ${req.body.firstName}`)
  if (req.body.firstName == "") {
    req.flash('error', 'First name is required')
    return res.redirect('/signup')
  }
  if (req.body.email == "") {
    req.flash('error', 'email is required')
    return res.redirect('/signup')
  }
  if (req.body.password.length <8) {
    req.flash('error', 'password atleast of 8 character')
    return res.redirect('/signup')
  }
  try {
    const user = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: hashedPwd,
      role: req.body.role
    })
    req.login(user, (err) => {
      if (err) {
        console.log(err)
      }
      
      res.redirect('/sports')
    })
  }
  catch (error) {
    req.flash("error", "Email already exist")
    return res.redirect("/signup")
  }
})
app.get('/login', async (req, res) => {
  if (req.accepts("html")) {
    res.render("login",
      {
        title: "Login",
        csrfToken: req.csrfToken(),
        
      })
  }
})
app.post('/login', passport.authenticate('local',
  {
    failureRedirect: '/login',
    failureFlash: true
  }
), (req, res) => {
  res.redirect('/sports')
  })
app.get('/signout', async (req, res) => {
  req.logout((err) => {
    if (err) {
      console.log(err)
    }
    res.redirect('/')
  })
})

module.exports = app;
