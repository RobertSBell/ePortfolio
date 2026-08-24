const mongoose = require("mongoose");
const User = require("../models/user"); 
const passport = require("passport");

const register = async (req, res) => {
  if (!req.body.name || !req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  try {
    const user = new User({
      name: req.body.name,
      email: req.body.email,
    });
    user.setPassword(req.body.password);
    const q = await user.save();

    if (!q) {
      return res.status(400).json({ message: "Error saving user." });
    } else {
      const token = user.generateJWT();
      return res.status(200).json({ token });
    }
  } catch (err) {
    console.error(err);
    return res.status(400).json({ message: "Registration failed.", error: err });
  }
};

const login = (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    return res.status(400).json({ message: "All fields required" });
  }

  passport.authenticate("local", (err, user, info) => {

    if (err) {
      return res.status(404).json(err);
    }

    if (user) {
      const token = user.generateJWT();
      return res.status(200).json({ token });
    } else {
      return res.status(401).json(info);
    }

  })(req, res, next);
};



module.exports = {
  register,
  login,
};