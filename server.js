const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const passport = require("passport");
const users = require("./routes/api/users");
const app = express();
const nodemailer = require('nodemailer');
const cron = require('node-cron')
// const multer = require('multer');
// Bodyparser middleware
app.use(
  bodyParser.urlencoded({
    extended: false
  })
);
app.use(bodyParser.json());


// DB Config
const db = require("./config/keys").mongoURI;
// Connect to MongoDB
mongoose
  .connect(
    db,
    { useNewUrlParser: true }
  )
  .then(() => console.log("MongoDB successfully connected"))
  .catch(err => console.log(err));

  let transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: "testexample9000@gmail.com",
        pass: "Letme1n!"
    }
})

// Here, we're scheduling a cron job and it will send an email at the start of every minute.
// Info contains the mail content.
// In case of sending mail to multiple users, we can add multiple recipients.
cron.schedule("* * * * *", () => {
    console.log("sending email")
    let mailOptions = {
        from: "testexample9000@gmail.com",
        to: "shubhamjangid07@yahoo.com",
        subject: "Nodemailer",
        text: "Continuous Emails",
        html: "<h1> You'll get the emails every minute. Please let me know how you want your mail to be ?</h1>"
}

transporter.sendMail(mailOptions, (err, info) => {
    if (err) {
        console.log("error occurred", err)
    } else {
        console.log("email sent", info)
    }
  })
})

app.get("", function(req, res) {
  
  res.sendFile(__dirname + "/routes/api/shubhamjangid.html");
});
app.use(express.static(__dirname + '/routes/api')); 
console.log(__dirname+ '/routes/api')

// app.use("./api/assets/images", express.static(__dirname + '/styles'));

// Passport middleware
app.use(passport.initialize());
// Passport config
require("./config/passpost")(passport);
// Routes
app.use("/api/users", users);
const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Server up and running on port ${port} !`));

