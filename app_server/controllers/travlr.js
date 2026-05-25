/* Get travel view */
exports.travel = function(req, res) {
  res.render('travel', { title: 'Travlr Getaways' });
};

module.exports = { 
    travel: this.travel
};
