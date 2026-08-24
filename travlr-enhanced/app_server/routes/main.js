var express = require('express');
var router = express.Router();
const controller = require('../controllers/main');
const roomsController = require('../controllers/rooms');

/* GET home page. */
router.get('/', controller.index);

/* GET about page. */
router.get('/about', controller.about);

/* GET rooms page. */
router.get('/rooms', roomsController.rooms);

/* GET meals page. */
router.get('/meals', controller.meals);

/* GET news page. */
router.get('/news', controller.news);

/* GET contact page. */
router.get('/contact', controller.contact);


module.exports = router;
