const express = require('express');
const router = express.Router();

const tripsController = require("../controllers/trips");

router
    .route('/trips')
    .get(tripsController.tripsList)  // GET: /trips - Return all trips
    .post(tripsController.tripsAddTrip);  // POST: /trips - Add a new trip

router.route('/trips/:tripCode').get(tripsController.tripsFindByCode);  // GET: /trips/:tripCode - Return a single trip by code

router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(tripsController.tripsUpdateTrip);

module.exports = router;
