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
const request = require('request-promise');

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

let accessToken = null;

async function getManagementAccessToken() {
  if (!accessToken) {
    const options = {
      method: 'POST',
      url: `https://${process.env.AUTH0_DOMAIN}/oauth/token`,
      headers: { 'content-type': 'application/json' },
      body: `{
        "client_id": "${process.env.AUTH0_CLIENT_ID}",
        "client_secret": "${process.env.AUTH0_CLIENT_SECRET}",
        "audience": "https://${process.env.AUTH0_DOMAIN}/api/v2/",
        "grant_type": "client_credentials"
      }`,
    };

    const response = await request(options);
    accessToken = JSON.parse(response)['access_token'];
  }

  return accessToken;
}

async function queryUsersById(queryIds, retry) {
  const options = {
    method: 'GET',
    url: `https://${process.env.AUTH0_DOMAIN}/api/v2/users`,
    qs: { q: `user_id:("${queryIds}")`, search_engine: 'v3' },
    headers: { authorization: `Bearer ${await getManagementAccessToken()}` },
  };

  try {
    return JSON.parse(await request(options));
  } catch (error) {
    accessToken = null;
    if (retry) {
      return queryUsersById(queryIds, false);
    }
    throw error;
  }
}

// endpoint to return all to-dos
app.get('/', async (req, res) => {
  const toDos = await getToDos();
  const userIdsWithDuplicates = toDos.map((toDo) => toDo.userId);
  const userIds = [...new Set(userIdsWithDuplicates)];
  const queryIds = userIds.join('" OR "');

  const users = await queryUsersById(queryIds, true);
  res.send(toDos.map(toDo => {
    let user = users.find((user) => (user['user_id'] === toDo.userId));
    if (!user) user = {
      user_id: 'unknown',
      name: 'unknown',
      nickname: 'unknown',
      picture: 'https://s.gravatar.com/avatar/d1ad971613b01e221226aa2f4700267a?s=480&r=pg&d=https%3A%2F%2Fcdn.auth0.com%2Favatars%2Fuk.png',
      email: 'unknown',
    };
    return {
      ...toDo,
      user,
    };
  }));
});

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_API,
  issuer: `https://${process.env.AUTH0_DOMAIN}/`,
  algorithms: ['RS256']
});

app.use(checkJwt);

app.post('/', async (req, res) => {
  const newToDo = req.body;
  newToDo.userId = req.user.sub;
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
    console.log('running with the following env vars:');
    console.log(process.env.AUTH0_CLIENT_ID);
    console.log(process.env.AUTH0_CLIENT_SECRET);
    console.log(process.env.AUTH0_DOMAIN);
    console.log(process.env.AUTH0_API);
    console.log('listening on port 3001');
  });
});
