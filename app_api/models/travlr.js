const mongoose = require('mongoose');

// Define the trip schema
const tripSchema = new mongoose.Schema({
    code: { type: String, required: true, index: true, unique: true },
    name: { type: String, required: true, index: true },
    length: { type: Number, required: true },
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    resort: { type: String, required: true },
    starRating: {
        type: Number,
        min: 1,
        max: 5,
        validate: {
            validator: function(value) {
                if (value == null) return true;

                return Number.isFinite(value) &&
                    Math.round(value * 10) === value * 10;
            },
            message: 'Star rating must be between 1 and 5 with at most one decimal place.'
        }
    },
    perPerson: { type: mongoose.Types.Decimal128, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
});

// Calculates the end date based on the start date and length, or calculates the length based on the start and end dates
tripSchema.pre('validate', function() {

    if (this.start && this.length && !this.end) {

        const end = new Date(this.start);
        end.setDate(end.getDate() + this.length);

        this.end = end;

    } else if (this.start && this.end && !this.length) {

        const startDate = new Date(this.start);
        const endDate = new Date(this.end);

        const difference =
            endDate.getTime() - startDate.getTime();

        this.length = Math.round(
            difference / (1000 * 60 * 60 * 24)
        );
    }
});

// Create the Trip model from the schema
const Trip = mongoose.model('trips', tripSchema);
module.exports = Trip;