var express  = require("express");
var router   = express.Router();
var passport = require("passport");
var User     = require("../models/user");
var Campground = require("../models/campground");
var async = require("async");
var nodemailer = require("nodemailer");
var crypto = require("crypto");

//Root route
router.get("/", (req, res) => {
	res.render("landing");
});

//show register form
router.get("/register", (req, res) => {
	res.render("register", {page: 'register'});
});
//Handle sign up logic
router.post("/register", async (req, res) => {
  try {
    var newUser = await new User({
      username: req.body.username,
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      avatar: req.body.avatar
    });
    //eval(require("locus"));
    if(req.body.adminCode === "secretcode123") {
      newUser.isAdmin = true;
    }
    let user = await User.register(newUser, req.body.password);
    passport.authenticate("local")(req, res, function() {
      req.flash("success", "Welcome to YelpCamp " + user.username);
      res.redirect("/campgrounds");	
    });
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    return res.redirect("/register");
  }
});



// LOGIN ROUTE
//show login form
router.get("/login", (req, res) => {
	res.render("login", {page: 'login'});
});
//handling login logic
router.post("/login", passport.authenticate("local", {
	successRedirect: "/campgrounds",
	failureRedirect: "/login"
}),function(req, res) {

});

// LOGOUT ROUTE
router.get("/logout", function(req, res) {
	req.logout();
	req.flash("success", "Logged you out!");
	res.redirect("/campgrounds");
});
// forgot password
router.get('/forgot', function(req, res) {
  res.render('forgot');
});
router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'tkwang0530@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'tkwang0530@gmail.com', //where you want people to reply
        subject: 'Node.js Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', async (req, res) => {
  try {
    let user = await User.findOne({resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now()}});
    res.render('reset', {token: req.params.token});
  } catch (error) {
    req.flash('error', 'Password reset token is invalid or has expired.');
    return res.redirect('/forgot');
  }
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'tkwang0530@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'tkwang0530@mail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/campgrounds');
  });
});

// USER PROFILE
router.get("/users/:id", async (req, res) => {
  try {
    let foundUser = await User.findById(req.params.id);
    if(!foundUser) {
      req.flash("error", "User not found.");
      res.redirect("/");
    }
    let campgrounds = await Campground.find().where("author.id").equals(foundUser._id).exec();
    if(!campgrounds) {
      req.flash("error", "campgrounds not found.");
      res.redirect("/");
    }
    res.render("users/show", {user: foundUser, campgrounds: campgrounds});
  } catch (error) {
    Console.log(error);
    req.flash("error", error.message);
    res.redirect("back");
  }
});
module.exports = router;