const request = require("supertest");
var cheerio = require('cheerio');
const db = require("../models/index");
const app = require("../app");

let server, agent;
function extractCsrfToken(res) {
   var $ = cheerio.load(res.text);
   return $("[name = _csrf]").val();
}

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(3000, () => {});
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

  test("Creates a todo and responds with json at /todos POST endpoint", async () => {
    const res = await agent.get('/');
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf" : csrfToken
    });
    expect(response.statusCode).toBe(302);
    
    
  });

  test("Marks a todo with the given ID as complete or incomplete", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: new Date().toISOString(),
      completed: false,
      // eslint-disable-next-line quote-props
      _csrf: csrfToken,
    });

    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedTodosResponse.text);
    const dueTodayCount = parsedGroupedResponse.dueToday.length;
    const latestTodo = parsedGroupedResponse.dueToday[dueTodayCount - 1];
    res = await agent.get("/");
    csrfToken = extractCsrfToken(res);
    const completeResponse = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf : csrfToken,
      completed: false,
    });
    const parseUpdateResponse = JSON.parse(completeResponse.text);
    expect(parseUpdateResponse.completed).toBe(true);
    const incompleteResponse = await agent.put(`/todos/${latestTodo.id}`).send({
      _csrf : csrfToken,
      completed: true,
    });
    const parseResponse = JSON.parse(incompleteResponse.text);
    expect(parseResponse.completed).toBe(false);

  });

  test("Fetches all todos in the database using /todos endpoint", async () => {
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
      title: "Buy xbox",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf" : csrfToken
    });
    await agent.post("/todos").send({
      title: "Buy ps3",
      dueDate: new Date().toISOString(),
      completed: false,
      "_csrf" : csrfToken
    });
    const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
   
    const parsedResponse = JSON.parse(groupedTodosResponse.text);

    expect(parsedResponse.dueToday.length).toBe(4);
    expect(parsedResponse.allTodos[3].title).toBe("Buy ps3");
  });

  test("Deletes a todo with the given ID if it exists and sends a boolean response", async () => {
    // FILL IN YOUR CODE HERE
    let res = await agent.get("/");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/todos").send({
        title: "Go to market",
        dueDate: new Date().toISOString(),
        completed: false,
        "_csrf" : csrfToken,
      });

      const groupedTodosResponse = await agent
      .get("/")
      .set("Accept", "application/json");
      const parsedResponse = JSON.parse(groupedTodosResponse.text);
      const todoID = parsedResponse.allTodos[0].id;
  
      const deleteTodoResponse = await agent.delete(`/todos/${todoID}`).send({
        "_csrf" : csrfToken,
      });
      const parsedDeleteResponse = JSON.parse(deleteTodoResponse.text);
      
      expect(parsedDeleteResponse).toBe(true);
  });
});
