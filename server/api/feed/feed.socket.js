/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Feed = require('./feed.model');

exports.register = function(socket) {
  Feed.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Feed.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('feed:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('feed:remove', doc);
}