const express = require('express');
const router = express.Router();

const tripsController = require("../controllers/trips");

router.route('/trips').get(tripsController.tripsList);  // GET: /trips - Return all trips
router.route('/trips/:tripCode').get(tripsController.tripsFindByCode);  // GET: /trips/:tripCode - Return a single trip by code

module.exports = router;
