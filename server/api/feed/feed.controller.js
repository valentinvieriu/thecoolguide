'use strict';

var _ = require('lodash');
var Feed = require('./feed.model');
var request = require('request');

// Get facebook feed
exports.facebook = function(req, res) {
  var url = 'https://graph.facebook.com/v2.1/thecoolguide/posts/?access_token='+process.env.FACEBOOK_ID+'|'+process.env.FACEBOOK_SECRET+'&fields=id,status_type,picture,link,message_tags,message,name&limit=250';
  request(url).pipe(res);
};

// Get facebook feed
exports.facebookDetails = function(req, res) {
  var url = 'https://graph.facebook.com/v2.1/?id='+req.params.id+'&access_token='+process.env.FACEBOOK_ID+'|'+process.env.FACEBOOK_SECRET+'';
  request(url).pipe(res);
};

// Process Facebook Batch
exports.facebookBatch = function(req, res) {
  // console.log(req.body);
  var url = 'https://graph.facebook.com/v2.1/';
    request.post({
      url:    url,
      form:    { 
        access_token: process.env.FACEBOOK_ID+'|'+process.env.FACEBOOK_SECRET ,
        batch:req.body.batch
      }
    }).pipe(res);
};
// Get list of feeds
exports.index = function(req, res) {
  Feed.find(function (err, feeds) {
    if(err) { return handleError(res, err); }
    return res.json(200, feeds);
  });
};

// Get a single feed
exports.show = function(req, res) {
  Feed.findById(req.params.id, function (err, feed) {
    if(err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    return res.json(feed);
  });
};

// Creates a new feed in the DB.
exports.create = function(req, res) {
  Feed.create(req.body, function(err, feed) {
    if(err) { return handleError(res, err); }
    return res.json(201, feed);
  });
};

// Updates an existing feed in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Feed.findById(req.params.id, function (err, feed) {
    if (err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    var updated = _.merge(feed, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, feed);
    });
  });
};

// Deletes a feed from the DB.
exports.destroy = function(req, res) {
  Feed.findById(req.params.id, function (err, feed) {
    if(err) { return handleError(res, err); }
    if(!feed) { return res.send(404); }
    feed.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}