'use strict';

const dotenv = require('dotenv');
dotenv.config();

const express = require('express');
const app = express();

const cors = require('cors');
app.use(cors()); // Middleware
const PORT = process.env.PORT;

//////////////////////////////////////////////////////////////////////////////////////////////////////////

const locationHandler = require('./modules/location');
app.get('/location', locationHandler);

const weatherHandler = require('./modules/weather');
console.log('weatherHandler', weatherHandler);
app.get('/weather', weatherHandler);

const trailHandler = require('./modules/trails');
app.get('/trails', trailHandler);

const yelpHandler = require('./modules/yelp');
app.get('/yelp', yelpHandler);

app.get('/movies',(request,response)=>
response.send([]) );

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


app.use(notFoundHandler);
app.use(errorHandler);

function errorHandler(error, request, response, next) {
  console.log(error);
  response.status(500).json({
    error: true,
    message: error.message,
  });
}

function notFoundHandler(request, response) {
  response.status(404).json({
    notFound: true,
  });
}


//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


const client = require('./utils/dataBase');
client.connect()
  .then(() => {
    console.log('Database connected.');
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
  })
  .catch(error => {
    throw `Something went wrong: ${error}`;
  });


