// ./src/index.js

//importing the dependencies
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const {startDatabase} = require('./database/mongo');
const {insertToDo, getToDos} = require('./database/to-dos');
const {deleteToDo, updateToDo} = require('./database/to-dos');
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// defining the Express app
const app = express();

// adding Helmet to enhance your API's security
app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests (not very secure)
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

// endpoint to return all to-dos
app.get('/', async (req, res) => {
  res.send(await getToDos());
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://blog-samples.auth0.com/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: 'https://to-dos-api',
  issuer: `https://blog-samples.auth0.com/`,
  algorithms: ['RS256']
});

app.use(checkJwt);

app.post('/', async (req, res) => {
  const newToDo = req.body;
  newToDo.subject = req.user.sub;
  await insertToDo(newToDo);
  res.send({ message: 'New to-do inserted.' });
});

// endpoint to delete an to-do
app.delete('/:id', async (req, res) => {
  await deleteToDo(req.params.id);
  res.send({ message: 'ToDo removed.' });
});

// endpoint to update an to-do
app.put('/:id', async (req, res) => {
  const updatedToDo = req.body;
  await updateToDo(req.params.id, updatedToDo);
  res.send({ message: 'ToDo updated.' });
});

// start the in-memory MongoDB instance
startDatabase().then(async () => {
  await insertToDo({message: 'Hi, friend. Share you thoughts!😊'});

  // start the server
  app.listen(3001, async () => {
    console.log('listening on port 3001');
  });
});
