var fs = require('fs');
var trips = JSON.parse(fs.readFileSync('./data/trips.json', 'utf8'));

/* Get travel view */
exports.travel = function(req, res) {
  res.render('travel', { title: 'Travlr Getaways', currentPage: 'travel', trips: trips });
};

module.exports = { 
    travel: this.travel
};
