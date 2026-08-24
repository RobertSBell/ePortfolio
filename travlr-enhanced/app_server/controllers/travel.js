const tripsEndpoint = 'http://localhost:3000/api/trips';

const options = {
    method: 'GET',
    headers: {
        'Accept': 'application/json'
    }
};

// Get travel view
exports.travel = async function(req, res, next) {

    try {
        const response = await fetch(tripsEndpoint, options);

        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }

        let json = await response.json();

        let message = null;

        if (!Array.isArray(json)) {
            message = "API lookup error.";
            json = [];
        }

        const trips = json.map(trip => {

            const start = new Date(trip.start);
            const end = new Date(trip.end);

            const length = Number(trip.length);

            return {
                ...trip,

                // Values formatted specifically for the public Travel page
                startDate: start.toLocaleDateString('en-US'),
                endDate: end.toLocaleDateString('en-US'),
                nights: length - 1,

                // Convert Decimal128 response to a regular number
                price: Number(
                    typeof trip.perPerson === 'object'
                        ? trip.perPerson.$numberDecimal
                        : trip.perPerson
                ).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                })
            };
        });

        res.render('travel', {
            title: 'Travlr Getaways',
            currentPage: 'travel',
            trips: trips,
            message: message
        });

    } catch (err) {
        console.error('Travel API error:', err);
        res.status(500).send(err.message);
    }
};

module.exports = {
    travel: this.travel
};