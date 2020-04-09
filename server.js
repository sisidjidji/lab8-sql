'use strict';

// Load Environment Variables from the .env file
const dotenv = require('dotenv');
dotenv.config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

const PORT = process.env.PORT;
const app = express();

const pg = require('pg');

if (!process.env.DATABASE_URL) {
  throw 'Missing DATABASE_URL';
}

const city = new pg.City(process.env.DATABASE_URL);
city.on('error', err => { throw err; });
app.use(cors()); // Middleware

app.get('/weather', weatherHandler) ;

function weatherHandler(request, response) {
  const weather=request.query.search_query;
  const url = 'https://api.weatherbit.io/v2.0/current';
  superagent.get(url)
  .query({
    key: process.env.WEATHER_KEY,
    city:weather, // query
    format: 'json'
  })
  .then(weatherResponse => {
    let weatherData=weatherResponse.body;
    let x= weatherData.data.map( dailyWeather=>{
          return new Weather(dailyWeather);
  })
  response.send(x);
})
  .catch(err => {
    console.log(err);
    errorHandler(err, request, response);
  })
 
}
app.get('/location', (request, response) => {
  const SQL = 'SELECT * FROM city';
  city.query(SQL)
    .then(results => {
      console.log(results);
      // let rowCount = results.rowCount;
      // let rows = results.rows;
      let { rowCount, rows } = results;

      if (rowCount === 0) {
        response.send({
          error: true,
          message: 'ERROR'
        });

      } else {
        response.send({
          error: false,
          results: rows,
        })
      }
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

  let { search_query, formatted_query,latitude,longitude } = request.query; // destructuring
  let SQL = `
    INSERT INTO city (search_query, formatted_query,latitude,longitude)
    VALUES($1, $2, $3,$4)
    RETURNING *
  `;
  let SQLvalues = [search_query, formatted_query,latitude,longitude];
  city.query(SQL, SQLvalues)
    .then(results => {
      response.send(results);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });


else{

app.get('/location', locationHandler);
}
})
function locationHandler(request, response) {
  // const geoData = require('./data/geo.json');
  const city = request.query.city;

  const url = 'https://us1.locationiq.com/v1/search.php';
  superagent.get(url)
    .query({
      key: process.env.GEO_KEY,
      q:city, // query
      format: 'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      // console.log(geoData);

      const location = new Location(city, geoData);
      setLocationInCache(city,location);
      response.send(location);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

  // response.send('oops');
}


app.get('/trail', trailHandler);

function trailHandler(request, response) {

  let lat = request.query.latitude;
  let lon = request.query.longitude;
  const url = 'https://www.hikingproject.com/data/get-trails';
  superagent.get(url)
    .query({
      key: process.env.TRAIL_KEY,
      lat: lat,
      lon: lon,
    })
    .then(trailResponse => {
      let trailData = trailResponse.body;
      let y = trailData.trails.map(dailytrail => {
        return new Trail(dailytrail);
      })
      response.send(y);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

}
}

// Has to happen after everything else
app.use(notFoundHandler);
// Has to happen after the error might have occurred
app.use(errorHandler); // Error Middleware

// Make sure the server is listening for requests
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));

// Helper Functions

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

function Location(city, geoData) {
  this.search_query = city; //
  this.formatted_query = geoData[0].display_name;
  this.latitude = parseFloat(geoData[0].lat);
  this.longitude = parseFloat(geoData[0].lon);
}




function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = new Date(weatherData.ob_time);
}


function Trail(trailData) {
  this.name = trailData.name;
  this.location = trailData.location;
  this.length = trailData.length;
  this.stars = trailData.stars;
  this.starVotes = trailData.starVotes;
  this.summary = trailData.summary;
  this.trail_url = trailData.url;
  this.conditions = trailData.conditionDetails;
  this.condition_date = new Date(trailData.conditionDate).toDateString();
}