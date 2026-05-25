/* GET Homepage */
exports.index = function(req, res) {
  res.render('index', { title: 'Travlr Getaways', currentPage: 'home' });
};

/* Get About view */
exports.about = function(req, res) {
  res.render('about', { title: 'Travlr Getaways', currentPage: 'about' });
};

/* Get Meals view */
exports.meals = function(req, res) {
  res.render('meals', { title: 'Travlr Getaways', currentPage: 'meals' });
};

/* Get News view */
exports.news = function(req, res) {
  res.render('news', { title: 'Travlr Getaways', currentPage: 'news' });
};

/* Get Contact view */
exports.contact = function(req, res) {
  res.render('contact', { title: 'Travlr Getaways', currentPage: 'contact' });
};

module.exports = {
    index: this.index,
    about: this.about,
    meals: this.meals,
    news: this.news,
    contact: this.contact
};
