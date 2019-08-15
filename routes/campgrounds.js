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
router.get("/", async (req, res) => {
  try {
    var noMatch = null;
    if (req.query.search) {
      
        const regex = new RegExp(escapeRegex(req.query.search), 'gi');
        // Get all campgrounds from DB
        let foundCampgrounds = await Campground.find({ name: regex });
        if(!foundCampgrounds || foundCampgrounds.length < 1) {
          noMatch = "No campgrounds match that query, please try again.";
        }
        res.render("campgrounds/index", { campgrounds: foundCampgrounds, page: 'campgrounds', noMatch: noMatch });
    
    } else {
        //get all campground from DB
        let allCampgrounds = await Campground.find({});
        if(!allCampgrounds) {
          req.flash('error', 'Cannot get all campgrounds from DB');
          return res.redirect('back');
        }
        res.render("campgrounds/index", { campgrounds: allCampgrounds, page: 'campgrounds', noMatch: noMatch });
    }
  } catch (error) {
  console.log(error);
}
});

// CREATE - Add new campground to DB
router.post("/", middleware.isLoggedIn, async (req, res) => {
  try {
    //get data from form and add to campgrounds array
  var name = req.body.name;
  var price = req.body.price;
  var image = req.body.image;
  var desc = req.body.description;
  var author = {
    id: req.user._id,
    username: req.user.username
  };
  const data = await geocoder.geocode(req.body.location);
  if (!data || !data.length) {
    req.flash('error', 'Invalid address');
    return res.redirect('back');
  }
  var lat = data[0].latitude;
  var lng = data[0].longitude;
  var location = data[0].formattedAddress;
  var newCampground = { 
      name: name, 
      price: price, 
      image: image, 
      description: desc, 
      author: author, 
      location: location, 
      lat: lat, 
      lng: lng 
  };
  // Create a new campground and save to DB
  const newlyCreated = await Campground.create(newCampground);
  if(!newlyCreated) {
    req.flash('error', 'fail to create a campground');
    return res.redirect('back');
  }
  //redirect back to campgrounds page
  console.log(newlyCreated);
  res.redirect("/campgrounds");
  } catch (error) {
    console.log(error);
  }
});



// NEW - Display form to make a new campground
router.get("/new", middleware.isLoggedIn, (req, res) => {
  res.render("campgrounds/new");
});

// SHOW - Shows info about one campground
router.get("/:slug", async (req, res) => {
  try {
    //find the campground with provided ID
  let foundCampground = await Campground.findOne({ slug: req.params.slug }).populate("comments").populate({
    path: "reviews",
    options: { sort: { createdAt: -1 } }
  }).exec();
  if(!foundCampground) {
    req.flash("error", "Campground not found");
    res.redirect("back");
  }
  res.render("campgrounds/show", { campground: foundCampground });
  } catch (error) {
    console.log(error);
  }
});

// EDIT CAMPGROUND ROUTE
router.get("/:slug/edit", middleware.checkCampgroundOwnership, async (req, res) => {
  try {
    let foundCampground = await Campground.findOne({slug: req.params.slug});
    res.render("campgrounds/edit", { campground: foundCampground });
  } catch (error) {
    console.log(error);
  }
});

// UPDATE CAMPGROUND ROUTE
router.put("/:slug", middleware.checkCampgroundOwnership, async (req, res) => {
  try {
    let data = await geocoder.geocode(req.body.location);
    if(!data || !data.length) {
      req.flash('error', 'Invalid address');
      return res.redirect('back');
    } 
  
    req.body.campground.lat = data[0].latitude;
    req.body.campground.lng = data[0].longitude;
    req.body.campground.location = data[0].formattedAddress;
    
    let campground = await Campground.findOne({slug: req.params.slug});
    campground.name = req.body.campground.name;
    campground.description = req.body.campground.description;
    campground.image = req.body.campground.image;
    campground.price = req.body.campground.price;
    campground.lat = req.body.campground.lat;
    campground.lng = req.body.campground.lng;
    campground.location = req.body.campground.location;
    console.log(campground);
    
    campground = await campground.save();
    req.flash("success", "Successfully Updated!");
    res.redirect("/campgrounds/" + campground.slug);
  } catch (error) {
    console.log(error);
    req.flash("error", error.message);
    res.redirect("/campgrounds");
  }
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:slug", middleware.checkCampgroundOwnership, async (req, res) => {
  try {
    let campground = await Campground.findOne({slug: req.params.slug});
    await Comment.remove({ "_id": { $in: campground.comments }});
    await Review.remove({ "_id": { $in: campground.comments }});
    await campground.remove();
    req.flash("success", "Campground deleted successfully!");
    res.redirect("/campgrounds");
  } catch (error) {
    console.log(error);
    return res.redirect("/campgrounds");
  }
});

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;