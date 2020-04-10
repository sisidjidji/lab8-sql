'use strict';


const superagent = require('superagent');

function yelpHandler(request, response) {

  const lat = request.query.latitude;
  const lon = request.query.longitude;

  const url = 'https://api.yelp.com/v3/businesses/search';
  superagent.get(url)
    .set('Authorization', 'Bearer ' + process.env.YELP_KEY)

    .query({
      latitude: lat,
      longitude: lon,
    })
    .then(yelpResponse => {
      let yelpData = yelpResponse.body;
      let x = yelpData.businesses.map(dailyelp => {
        return new Yelp(dailyelp);
      });
      response.send(x);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function Yelp (yelpData) {
  this.name= yelpData.name ;
  this.image_url= yelpData.image_url;
  this.price= yelpData.price;
  this.rating= yelpData.rating;
  this.url=yelpData.url;
}

module.exports = yelpHandler;
