// Bring in the DB connection and the Trip schema
const mongoose = require('./db');
const Trip = require('./travlr');

// Read in the JSON seed data
var fs = require('fs');
var triplist = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

// delete any existing records, then insert seed data
const seedDB = async () => {
    try {
        await Trip.deleteMany({});
        await Trip.insertMany(triplist);
    } catch (err) {
        console.error(err);
    }
};

// Close the MongoDB connection and exit
seedDB().then(async () => {
    await mongoose.connection.close();
    process.exit(0);
});