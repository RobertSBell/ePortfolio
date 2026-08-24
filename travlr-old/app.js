// Bring in the authentication middleware
const dotenv = require('dotenv');

const result = dotenv.config();

console.log(result);

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');


// Bring in Passport configuration
var passport = require('./app_api/config/passport');

var mainRouter = require('./app_server/routes/main');
var usersRouter = require('./app_server/routes/users');
var travelRouter = require('./app_server/routes/travel');
var apiRouter = require('./app_api/routes/index');

var handlebars = require('hbs');

// Bring in the database
var db = require('./app_api/models/db');

var app = express();


// view engine setup
app.set('views', path.join(__dirname, 'app_server', 'views'));

// register handlebars partials
handlebars.registerPartials(__dirname + '/app_server/views/partials');

// register helper (For dynamic header) [Toggles the 'selected' class on the current page's header link]
handlebars.registerHelper('isSelected', function(currentPage, pageName) {
  return currentPage === pageName ? 'selected' : '';
});

// register helper (For dynamic footer) [Toggles the 'active' class on the current page's footer link]
handlebars.registerHelper('isActive', function(currentPage, pageName) {
  return currentPage === pageName ? 'active' : '';
});

app.set('view engine', 'hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Enable CORS for the Angular admin app and prevent the browser from caching API responses
app.use('/api', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE,OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use('/', mainRouter);
app.use('/users', usersRouter);
app.use('/travel', travelRouter);
app.use('/api', apiRouter);
// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
