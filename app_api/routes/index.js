const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

const tripsController = require("../controllers/trips");
const authController = require("../controllers/authentication");

//
// JWT Authentication Middleware
//
function authenticateJWT(req, res, next) {

    // console.log('In Middleware');

    const authHeader = req.headers['authorization'];

    // console.log('Auth Header: ' + authHeader);

    if (authHeader == null) {
        console.log('Authorization Header Required but NOT PRESENT!');
        return res.sendStatus(401);
    }

    const headers = authHeader.split(' ');

    if (headers.length < 2) {
        console.log('Not enough tokens in Authorization Header.');
        return res.sendStatus(401);
    }

    const token = headers[1];

    // console.log('Token: ' + token);

    if (token == null) {
        console.log('Null Bearer Token');
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {

        if (err) {
            console.log('Token Validation Error');
            console.log(err);
            return res.sendStatus(401);
        }

        req.auth = verified;

        next();
    });
}

//
// Authentication Routes
//
router.route("/register").post(authController.register);
router.route("/login").post(authController.login);

//
// Trip Routes
//
router.route('/trips')
    .get(tripsController.tripsList)
    .post(authenticateJWT, tripsController.tripsAddTrip);

router.route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(authenticateJWT, tripsController.tripsUpdateTrip);

module.exports = router;