var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");
var Review = require("../models/review");
var Comment = require("../models/comment");

//var middleware = require("../middleware/index.js");
var middleware = require("../middleware");
// GeoCoder of Google
var NodeGeocoder = require('node-geocoder');

var options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null
};

var geocoder = NodeGeocoder(options);

// INDEX - Show all campgrounds
router.get("/", function (req, res) {
  var noMatch = null;
  if (req.query.search) {
    const regex = new RegExp(escapeRegex(req.query.search), 'gi');
    // Get all campgrounds from DB
    Campground.find({ name: regex }, function (err, allCampgrounds) {
      if (err) {
        console.log(err);
      } else {
        if (allCampgrounds.length < 1) {
          noMatch = "No campgrounds match that query, please try again.";
        }
        res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch });
      }
    });
  } else {
    //get all campground from DB
    Campground.find({}, function (err, allCampgrounds) {
      if (err) console.log(err);
      else {
        res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch });
      }
    });
  }

});

// CREATE - Add new campground to DB
router.post("/", middleware.isLoggedIn, function (req, res) {
  //get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    var lat = data[0].latitude;
    var lng = data[0].longitude;
    var location = data[0].formattedAddress;
    var newCampground = { name: name, price: price, image: image, description: desc, author: author, location: location, lat: lat, lng: lng };
    // Create a new campground and save to DB
    Campground.create(newCampground, function (err, newlyCreated) {
      if (err) {
        console.log(err);
      } else {
        //redirect back to campgrounds page
        console.log(newlyCreated);
        res.redirect("/campgrounds");
      }
    });
  });
});



// NEW - Display form to make a new campground
router.get("/new", middleware.isLoggedIn, function (req, res) {
  res.render("campgrounds/new");
});

// SHOW - Shows info about one campground
router.get("/:slug", function (req, res) {
  //find the campground with provided ID
  Campground.findOne({ slug: req.params.slug }).populate("comments").populate({
    path: "reviews",
    options: { sort: { createdAt: -1 } }
  }).exec(function (err, foundCampground) {
    if (err || !foundCampground) {
      console.log(err);
      console.log(foundCampground);
      req.flash("error", "Campground not found");
      res.redirect("back");
    } else {
      //render show template with that campground
      res.render("campgrounds/show", { campground: foundCampground });
    }
  });
});

// EDIT CAMPGROUND ROUTE
router.get("/:slug/edit", middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findOne({ slug: req.params.slug }, function (err, foundCampground) {
    res.render("campgrounds/edit", { campground: foundCampground });
  });
});

// UPDATE CAMPGROUND ROUTE
router.put("/:slug", middleware.checkCampgroundOwnership, function (req, res) {
  geocoder.geocode(req.body.location, function (err, data) {
    if (err || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    }
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    Campground.findOne({ slug: req.params.slug }, function (err, campground) {
      if (err) {
        req.flash("error", err.message);
        res.redirect("back");
      } else {
        //campground = req.body.campground;
        campground.name = req.body.campground.name;
        campground.description = req.body.campground.description;
        campground.image = req.body.campground.image;
        campground.price = req.body.campground.price;
        campground.lat = req.body.campground.lat;
        campground.lng = req.body.campground.lng;
        campground.location = req.body.campground.location;
        campground.save(function (err) {
          if (err) {
            req.flash("error", err.message);
            res.redirect("/campgrounds");
          } else {
            req.flash("success", "Successfully Updated!");
            res.redirect("/campgrounds/" + campground.slug);
          }
        });
      }
    });
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:slug", middleware.checkCampgroundOwnership, function (req, res) {
  Campground.findOne({ slug: req.params.slug }, function (err, campground) {
    if (err) {
      res.redirect("/campgrounds");
    } else {
      // deletes all comments associated with the campground
      Comment.remove({ "_id": { $in: campground.comments } }, function (err) {
        if (err) {
          console.log(err);
          return res.redirect("/campgrounds");
        }
        // deletes all reviews associated with the campground
        Review.remove({ "_id": { $in: campground.reviews } }, function (err) {
          if (err) {
            console.log(err);
            return res.redirect("/campgrounds");
          }
          //  delete the campground
          campground.remove();
          req.flash("success", "Campground deleted successfully!");
          res.redirect("/campgrounds");
        });
      });
    }
  });
});




function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;