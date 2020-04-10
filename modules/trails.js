'use strict';
const superagent = require('superagent');


function trailHandler(request, response) {

  let lat = request.query.latitude;
  let lon = request.query.longitude;
  const url = 'https://www.hikingproject.com/data/get-trails';
  return superagent.get(url)
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

module.exports = trailHandler;