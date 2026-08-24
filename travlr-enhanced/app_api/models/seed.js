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

        const trips = triplist.map(trip => {

            // If length exists but end does not, calculate end
            if (trip.start && trip.length && !trip.end) {

                const end = new Date(trip.start);

                end.setDate(end.getDate() + Number(trip.length));

                trip.end = end.toISOString();

            }

            // If end exists but length does not, calculate length
            else if (trip.start && trip.end && !trip.length) {

                const startDate = new Date(trip.start);
                const endDate = new Date(trip.end);

                const difference =
                    endDate.getTime() - startDate.getTime();

                trip.length = Math.round(
                    difference / (1000 * 60 * 60 * 24)
                );
            }

            return trip;
        });

        await Trip.insertMany(trips);
        
    } catch (err) {
        console.error(err);
    }
};

// Close the MongoDB connection and exit
seedDB().then(async () => {
    await mongoose.connection.close();
    process.exit(0);
});