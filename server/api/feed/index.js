'use strict';

var express = require('express');
var controller = require('./feed.controller');

var router = express.Router();

router.get('/facebook', controller.facebook);
router.get('/facebookDetails/:id', controller.facebookDetails);
router.post('/facebookBatch', controller.facebookBatch);
// router.get('/', controller.index);
// router.get('/:id', controller.show);
// router.post('/', controller.create);
// router.put('/:id', controller.update);
// router.patch('/:id', controller.update);
// router.delete('/:id', controller.destroy);

module.exports = router;