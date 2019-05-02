// ./src/index.js

//importing the dependencies
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { startDatabase } = require("./database/mongo");
const { insertToDo, getToDos } = require("./database/to-dos");
const { deleteToDo, updateToDo } = require("./database/to-dos");

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests (not very secure)
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan("combined"));

// endpoint to return all to-dos
app.get("/", async (req, res) => {
  res.send(await getToDos(req));
});

app.post("/", async (req, res) => {
  const newToDo = req.body;
  await insertToDo(newToDo);
  res.send({ message: "New to-do inserted." });
});

// endpoint to delete an to-do
app.delete("/:id", async (req, res) => {
  await deleteToDo(req.params.id);
  res.send({ message: "ToDo removed." });
});

// endpoint to update an to-do
app.put("/:id", async (req, res) => {
  const updatedToDo = req.body;
  await updateToDo(req.params.id, updatedToDo);
  res.send({ message: "ToDo updated." });
});

// start the in-memory MongoDB instance
startDatabase().then(async () => {
  //await insertToDo({message: 'Buy pizza!'});
  for (let index = 0; index < 2000; index++) {
    //const element = array[index];
    await insertToDo({ message: "Buy pizza!" + index });
  }

  // start the server
  app.listen(3001, async () => {
    console.log("listening on port 3001");
  });
});
