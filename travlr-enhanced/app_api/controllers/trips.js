const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
const User = require('../models/user'); // Register model
const Model = mongoose.model('trips');

// GET: /trips - Return all trips
// Regardless of the outcome, response must include HTML status code and JSON data
const tripsList = async (req, res) => {
    const q = await Model
        .find({}) //return all trips
        .exec();

        //console.log(q);

    if (!q) {
        return res
            .status(404)
            .json(err);
    } else {// Return the list of trips
        return res
            .status(200)
            .json(q);
    }
};

// POST: /trips - Add a new trip
// POST: /trips - Add a new trip
const tripsAddTrip = async (req, res) => {
    const newTrip = new Trip({
        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        end: req.body.end,
        resort: req.body.resort,
        starRating: req.body.starRating,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description
    });

    try {
        const q = await newTrip.save();

        return res
            .status(201)
            .json(q);

    } catch (err) {

        // Duplicate trip code
        if (err.code === 11000) {
            return res
                .status(409)
                .json({
                    message: "A trip with this code already exists."
                });
        }

        console.error(err);

        return res
            .status(400)
            .json({
                message: "Error creating trip."
            });
    }
};

// GET: /trips/:tripCode - Return a single trip by code
const tripsFindByCode = async (req, res) => {
    const q = await Model
        .findOne({'code' : req.params.tripCode })  //return single record
        .exec();

        //console.log(q);
        
    if (!q) {
        return res
            .status(404)
            .json({message: "Trip not found"});
    } else {
        return res
            .status(200)
            .json(q);
    }
};

// Helper function: getUser
const getUser = async (req, res, callback) => {
  if (req.auth && req.auth.email) {
    try {
      const user = await User.findOne({ email: req.auth.email });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      callback(req, res, user); // Pass the user to the callback for extensibility
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Server error", details: err });
    }
  } else {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

// PUT: /trips/:tripCode - Adds a new Trip
// Regardless of outcome, response must include HTML status
// and JSON message to the requesting client
// PUT: /trips/:tripCode - Update an existing Trip
const tripsUpdateTrip = async (req, res) => {

    try {
        const q = await Model
            .findOneAndUpdate(
                { code: req.params.tripCode },
                {
                    code: req.body.code,
                    name: req.body.name,
                    length: req.body.length,
                    start: req.body.start,
                    end: req.body.end,
                    resort: req.body.resort,
                    starRating: req.body.starRating,
                    perPerson: req.body.perPerson,
                    image: req.body.image,
                    description: req.body.description
                },
                {
                    new: true,
                    runValidators: true
                }
            )
            .exec();

        if (!q) {
            return res
                .status(404)
                .json({
                    message: "Trip not found."
                });
        }

        return res
            .status(200)
            .json(q);

    } catch (err) {

        // Duplicate trip code
        if (err.code === 11000) {
            return res
                .status(409)
                .json({
                    message: "A trip with this code already exists."
                });
        }

        console.error(err);

        return res
            .status(400)
            .json({
                message: "Error updating trip."
            });
    }
};


module.exports = {
    tripsList,
    tripsAddTrip,
    tripsFindByCode,
    tripsUpdateTrip
};