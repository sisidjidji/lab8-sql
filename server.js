'use strict';

/////////////////////////////////////// Load Environment Variables from the .env file////////////////////////////////
const dotenv = require('dotenv');
dotenv.config();

///////////////////////////////// Application Dependencies///////////////////////////////////////////////////////
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

////////////////////////////////////////////////////////////client//////////////////////////////////////////////
const PORT = process.env.PORT;
const app = express();

const pg = require('pg');
if (!process.env.DATABASE_URL) {
  throw 'Missing DATABASE_URL';
}

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => { throw err; });
app.use(cors()); // Middleware

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

app.get('/location', locationHandler);
app.get('/trail', trailHandler);
app.get('/weather', weatherHandler);

////////////////////////////////////////location/////////////////////////////////////////

function locationHandler(request, response) {
  // const geoData = require('./data/geo.json');
  const city = request.query.city;

  getLocationFromCache(city)
    .then(result => {
      console.log('Location from cache', result.rows);
      let { rowCount, rows } = result;
      if (rowCount > 0) {
        response.send(rows[0]);
      }
      else {
        return getLocationFromAPI(city, response);
      }
    });
}

function getLocationFromCache(city) {
  const SQL = `
    SELECT *
    FROM locations
    WHERE search_query = $1
    LIMIT 1
  `;
  const parameters = [city];

  return client.query(SQL, parameters);
}


function setLocationInCache(location) {
  const { search_query, formatted_query, latitude, longitude } = location;

  const SQL = `
    INSERT INTO locations (search_query, formatted_query, latitude, longitude)
    VALUES ($1, $2, $3, $4)
    -- RETURNING *
  `;
  const parameters = [search_query, formatted_query, latitude, longitude];

  // Return the promise that we'll have done a query
  return client.query(SQL, parameters)
    .then(result => {
      console.log('Cache Location', result);
    })
    .catch(err => {
      console.error('Failed to cache location', err);
    });
}

function getLocationFromAPI(city, response) {
  console.log('Requesting location from API', city);
  const url = 'https://us1.locationiq.com/v1/search.php';
  return superagent.get(url)
    .query({
      key: process.env.GEO_KEY,
      q: city, // query
      format: 'json'
    })
    .then(locationResponse => {
      let geoData = locationResponse.body;
      // console.log(geoData);

      const location = new Location(city, geoData);

      setLocationInCache(location)
        .then(() => {
          console.log('Location has been cached', location);

          response.send(location);
        });

    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

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
      });
      response.send(y);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

}



///////////////////////////////weather////////////////////////////////////////////////////////////////////
function weatherHandler(request, response) {
  const weather = request.query.search_query;
  const url = 'https://api.weatherbit.io/v2.0/forecast/daily';
  superagent.get(url)
    .query({
      key: process.env.WEATHER_KEY,
      city: weather, // query
      format: 'json'
    })
    .then(weatherResponse => {
      let weatherData = weatherResponse.body;
      let x = weatherData.data.map(dailyWeather => {
        return new Weather(dailyWeather);
      });
      response.send(x);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });

}
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////



///////////////////////////////////////errors////////////////////////////////////////////////////////////////////
// Has to happen after everything else
app.use(notFoundHandler);
// Has to happen after the error might have occurred
app.use(errorHandler); // Error Middleware


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
/////////////////////////////////////////////////////////////Constructor function///////////////////////////////////////////////////////////////
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

client.connect()
  .then(() => {
    console.log('Database connected.');
    app.listen(PORT, () => console.log(`Listening on ${PORT}`));
  })
  .catch(error => {
    throw `Something went wrong: ${error}`;
  });
