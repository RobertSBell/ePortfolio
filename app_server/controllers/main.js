/* GET Homepage */
exports.index = function(req, res) {
  res.render('index', { title: 'Travlr Getaways' });
};

module.exports = {
    index: this.index
};
