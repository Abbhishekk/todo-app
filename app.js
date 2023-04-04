/* eslint-disable no-unused-vars */
const express = require("express");
var csrf = require('csurf');
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require('cookie-parser');
const path = require("path");
const { stringify } = require("querystring");

app.use(bodyParser.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser('shh! some secret string'));
app.use(csrf({cookie: true}));
app.set("view engine","ejs");


app.get("/", async (request, response) =>{
  const allTodos = await Todo.getTodos();
  const dueToday = await Todo.dueToday();
  const duelater = await Todo.duelater();
  const overdue = await Todo.overdue();
  const allCompleted = await Todo.allCompleted();
  if(request.accepts("HTML")){
    response.render("index",{
      dueToday,duelater,overdue,allCompleted,
      csrfToken : request.csrfToken() 
    });
    
  }
  else{
    response.json({
      allTodos,dueToday
    })
  }
  
})

// eslint-disable-next-line no-undef
app.use(express.static(path.join(__dirname,'public')))

app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  // FILL IN YOUR CODE HERE
  try {
    const todoList = await Todo.findAll()
    return response.send(todoList);
  } catch (error) {
    console.log(error)
    return response.status(422).send(error)
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

app.post("/todos", async function (request, response) {
  try {
    console.log(request.body.title);
    const todo = await Todo.addTodo(request.body);
    return response.redirect('/');
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    
    const updatedTodo = await todo.setCompletionStatus(request.body.completed);
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

// eslint-disable-next-line no-unused-vars
app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  // FILL IN YOUR CODE HERE

  try {
    
  const deleteTodo = await Todo.destroy({
    where: {
      id : request.params.id,
    },
  })
  return response.send(deleteTodo ? true : false);
  } catch (error) {
    console.log(error)
    return response.status(422).send(error);
  }
  
  // First, we have to query our database to delete a Todo by ID.
  // Then, we have to respond back with true/false based on whether the Todo was deleted or not.
  // response.send(true)
});

module.exports = app;
