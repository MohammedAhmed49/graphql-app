const bcryptjs = require("bcryptjs");
const { validationResult } = require("express-validator");
const User = require("../models/user");
const { errorHandler } = require("../utils/error");
const jsonwebtoken = require("jsonwebtoken");

exports.signup = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("Validation failed!");
    error.statusCode = 422;
    error.data = errors.array();
    throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;

  bcryptjs
    .hash(password, 12)
    .then((hashedPassword) => {
      return User.create({
        email,
        name,
        password: hashedPassword,
      });
    })
    .then((user) => {
      res.status(201).json({ userId: user._id });
    })
    .catch((err) => {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      throw err;
    });
};

exports.signIn = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  User.findOne({ email })
    .then((user) => {
      if (!user) {
        const error = new Error("The email is incorrect");
        error.statusCode = 401;
        throw error;
      }
      loadedUser = user;
      return bcryptjs.compare(password, user.password);
    })
    .then((isEqual) => {
      if (!isEqual) {
        const error = new Error("The password is incorrect");
        error.statusCode = 401;
        throw error;
      }

      const token = jsonwebtoken.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString(),
        },
        "solongsecretkey",
        {
          expiresIn: "1h",
        }
      );
      res.status(200).json({ token, userId: loadedUser._id.toString() });
    })
    .catch((err) => errorHandler(next, err));
};
