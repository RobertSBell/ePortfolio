const mongoose = require('mongoose');
const Trip = require('../models/travlr'); // Register model
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
const tripsAddTrip = async (req, res) => {
    const newTrip = new Trip({
        code: req.body.code,
        name: req.body.name,
        length: req.body.length,
        start: req.body.start,
        resort: req.body.resort,
        perPerson: req.body.perPerson,
        image: req.body.image,
        description: req.body.description
    });

    const q = await newTrip.save();

    if (!q) {
        return res
            .status(400)
            .json({message: "Error creating trip"});
    } else {
        return res
            .status(201)
            .json(q);
    }
};

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

// PUT: /trips/:tripCode - Adds a new Trip
// Regardless of outcome, response must include HTML status
// and JSON message to the requesting client
const tripsUpdateTrip = async(req, res) => {
// Uncomment for debugging
console.log(req.params);
console.log(req.body);
const q = await Model
.findOneAndUpdate(
{ 'code' : req.params.tripCode },
{
code: req.body.code,
name: req.body.name,
length: req.body.length,
start: req.body.start,
resort: req.body.resort,
perPerson: req.body.perPerson,
image: req.body.image,
description: req.body.description
}
)
.exec();
if(!q)
{ // Database returned no data
return res
.status(400)
.json(err);
} else { // Return resulting updated trip
return res
.status(201)
.json(q);
}
// Uncomment the following line to show results in the console for debugging
// console.log(q);
};


module.exports = {
    tripsList,
    tripsAddTrip,
    tripsFindByCode,
    tripsUpdateTrip
};