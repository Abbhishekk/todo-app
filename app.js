/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require("csurf");
const app = express();
const { Todo, user } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
const passport = require("passport");
const ConnectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");
const { stringify } = require("querystring");
const { error } = require("console");
//const { next } = require("cheerio/lib/api/traversing");
const flash = require("connect-flash");

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("shh! some secret string"));
// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname, "public")));
app.use(csrf({ cookie: true }));
app.set("view engine", "ejs");

app.use(
  session({
    secret: "My-secret-key-1515464651315646115316",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);
app.use(flash());

app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});

app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      //passReqToCallback : true
    },
    (username, password, done) => {
      console.log("finding user...");
      user
        .findOne({
          where: {
            email: username,
          },
        })
        .then(async (users) => {
          //console.log("user found")
          const result = await bcrypt.compare(password, users.password);
          if (result) {
            return done(null, users);
          } else {
            return done(null, false, { message: "Invalid Password " });
          }
        })
        .catch((error) => {
          console.log("Authentication failed");
          return done(error);
        });
    }
  )
);

const salRounds = 10;

passport.serializeUser((users, done) => {
  console.log("Serializing user in session : ", users.id);
  done(null, users.id);
});

passport.deserializeUser((id, done) => {
  console.log("deserializing user from session: ", id);
  user
    .findByPk(id)
    .then((users) => {
      done(null, users);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.get("/", async (request, response) => {
  console.log("/ is called");
  response.render("index", {
    csrfToken: request.csrfToken(),
  });
});

app.get(
  "/todos",
  ConnectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    console.log("/todos is called");
    const loggedinUser = request.user.id;
    const allTodos = await Todo.getTodos(loggedinUser);
    const dueToday = await Todo.dueToday(loggedinUser);
    const duelater = await Todo.duelater(loggedinUser);
    const overdue = await Todo.overdue(loggedinUser);
    const allCompleted = await Todo.allCompleted(loggedinUser);
    if (request.accepts("HTML")) {
      response.render("todo", {
        dueToday,
        duelater,
        overdue,
        allCompleted,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        allTodos,
        dueToday,
        duelater,
        overdue,
        allCompleted,
      });
    }
  }
);

// eslint-disable-next-line no-undef

app.get("/signup", (request, response) => {
  console.log("/signup is called");
  response.render("user", {
    failure: false,
    csrfToken: request.csrfToken(),
  });
});

app.post("/users", async (request, response) => {
  console.log("/users is called");
  const hashPwd = await bcrypt.hash(request.body.password, salRounds);
  console.log(hashPwd)
  if (!request.body.firstname) {
    request.flash("error", "Enter name");
    return response.redirect("/signup");
  }
  if (!request.body.email) {
    request.flash("error", "Enter email");
    return response.redirect("/signup");
  }

  //console.log(hashPwd)
  try {
    const User = await user.create({
      firstname: request.body.firstname,
      lastname: request.body.lastname,
      email: request.body.email,
      password: hashPwd,
    });
    //console.log(User);
    request.login(User, (err) => {
      if (err) {
        console.log("Error loging in");
        response.render("user", {
          failure: true,
          csrfToken: request.csrfToken(),
        });
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log("Email already registered!", error);
    response.render("user", { failure: true, csrfToken: request.csrfToken() });
  }
});

app.get("/login", (request, response) => {
  console.log("/login is called");
  response.render("login", { title: "LogIn", csrfToken: request.csrfToken() });
});
//passport.authenticate('local',{ failureRedirect : '/login',failureFlash : "login Failed"  }),
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    console.log(request.user);
    console.log("/session is called");
    response.redirect("/todos");
  }
);

app.get("/signout", (request, response, next) => {
  console.log("/signout is called");
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

app.get("/todo", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
  try {
    const todoList = await Todo.findAll();
    return response.send(todoList);
  } catch (error) {
    console.log(error);
    return response.status(422).send(error);
  }
  // First, we have to query our PostgerSQL database using Sequelize to get list of all Todos.
  // Then, we have to respond with all Todos, like:
  // response.send(todos)
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post(
  "/todos",
  ConnectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    if (request.body.title.length < 5) {
      request.flash("error", "Title length should be atleast 5");
      return response.redirect("/todos");
    }
    if (!request.body.dueDate) {
      request.flash("error", "Please select a due date");
      return response.redirect("/todos");
    }

    try {
      console.log(request.user.id);
      const todo = await Todo.addTodo({
        title: request.body.title,
        dueDate: request.body.dueDate,
        userId: request.user.id,
      });
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

app.put(
  "/todos/:id",
  ConnectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    const todo = await Todo.findByPk(request.params.id);
    try {
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.json(updatedTodo);
    } catch (error) {
      console.log(error);
      return response.status(422).json(error);
    }
  }
);

// eslint-disable-next-line no-unused-vars
app.delete(
  "/todos/:id",
  ConnectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("We have to delete a Todo with ID: ", request.params.id);
    // FILL IN YOUR CODE HERE

    try {
      const deleteTodo = await Todo.destroy({
        where: {
          id: request.params.id,
        },
      });
      return response.send(deleteTodo ? true : false);
    } catch (error) {
      console.log(error);
      return response.status(422).send(error);
    }

    // First, we have to query our database to delete a Todo by ID.
    // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
    // response.send(true)
  }
);

module.exports = app;
