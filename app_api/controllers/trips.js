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

module.exports = {
    tripsList,
    tripsFindByCode
};