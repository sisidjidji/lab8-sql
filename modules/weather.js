'use strict'

const superagent = require('superagent');

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

function Weather(weatherData) {
  this.forecast = weatherData.weather.description;
  this.time = new Date(weatherData.ob_time);
}

module.exports = weatherHandler;