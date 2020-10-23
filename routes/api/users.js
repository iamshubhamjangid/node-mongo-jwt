"use strict";
const express = require("express");
const bodyParser = require('body-parser')
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const keys = require("../../config/keys");
var cookieParser = require('cookie-parser');
var multer = require('multer');
var cron = require('node-cron');
var nodemailer = require('nodemailer');
var fs = require('fs');




var storage =   multer.diskStorage({
  destination: function (req, file, callback) {
    fs.mkdir('./uploads', function(err) {
        if(err) {
            console.log(err.stack)
        } else {
            callback(null, './uploads');
        }
    })
  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now());
  }
});;


// Load input validation
const validateRegisterInput = require("../../validation/register");
const validateLoginInput = require("../../validation/login");
// Load User model
const User = require("../../models/User");
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json())
// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", (req, res) => {
  // Form validation
  const { errors, isValid } = validateRegisterInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  User.findOne({ email: req.body.email }).then(user => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password
      });
      // Hash password before saving in database
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          console.log(hash);
          newUser.password = hash;
          newUser
            .save()
            .then(user => res.json(user))
            .catch(err => console.log(err));
        });
      });
    }
  });
});
// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email
  User.findOne({ email }).then(user => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then(isMatch => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926 // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: token
            });
          }
        );

      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

router.get("/token", function(req, res) {
  var token = jwt.sign({ payload: "" }, "secret", { expiresIn: 120 });
  res.send(token);
  // console.log(token)
});

router.get("/userdata", function(req, res) {
  var token = req.headers['x-access-token'];

  // var token = req.headers['x-access-token'];
  // var token = req.query.token;
  // var token = new Cookies(req, res).get(access_token);
  jwt.verify(token, keys.secretOrKey, function(err, decoded) {
    if (!err) {
      User.find(function(err, user) {
        // if there is an error retrieving, send the error otherwise send data
        if (err) res.send(err);
        res.json(user); // return all employees in JSON format
      });
    } else {
      res.send(err);
    }
  });
});
router.get("/fileupload", function(req, res) {
  res.sendFile(__dirname + "/index.html");
});
// router.post("/Upload", function(req, res) {
//   upload(req, res, function(err) {
//       if (err) {
//           return res.end("Something went wrong!");
//       }
//       else{
//       return res.end("File uploaded sucessfully!.");}
//   });
// });

router.post('/file',function(req,res){
  var upload = multer({ storage : storage}).single('userFile');
  upload(req,res,function(err) {
      if(err) {
          return res.end("Error uploading file.");
      }
      res.end("File is uploaded");
  });
});
module.exports = router;
