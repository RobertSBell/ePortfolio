var fs = require('fs');
var roomlist = JSON.parse(fs.readFileSync('./data/roomlist.json', 'utf8'));

/* Get rooms view */
exports.rooms = function(req, res) {
  res.render('rooms', { title: 'Travlr Getaways', currentPage: 'rooms', rooms: roomlist });
};

module.exports = { 
    rooms: this.rooms
};
