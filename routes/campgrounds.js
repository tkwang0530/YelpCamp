var express = require("express");
var router = express.Router();
var Campground = require("../models/campground");

//var middleware = require("../middleware/index.js");
var middleware = require("../middleware");

// INDEX - Show all campgrounds
router.get("/", function(req, res) {
	//get all campground from DB
	Campground.find({}, function(err, allCampgrounds) {
		if(err) console.log(err);
		else {
			res.render("campgrounds/index", {campgrounds: allCampgrounds});
		}
	});
});

// CREATE - Add new campground to DB
router.post("/", middleware.isLoggedIn, function(req, res) {
	//get data from form and add to campgrounds array
	var name = req.body.name;
	var price = req.body.price;
	var image = req.body.image;
	var desc = req.body.description;
	var author = {
		id: req.user._id,
		username: req.user.username
	};
	var newCampground = {name: name, price: price, image: image, description: desc, author: author};
	//campgrounds.push(newCampground);
	//Create a new campground and save to DB
	Campground.create(newCampground, function(err, newlyCreated) {
		if(err) console.log(err);
		else{
			console.log(newlyCreated);
			//redirect back to campgrounds page
			res.redirect("/campgrounds");
		}
	});
});

// NEW - Display form to make a new campground
router.get("/new", middleware.isLoggedIn, function(req, res) {
	res.render("campgrounds/new");
});

// SHOW - Shows info about one campground
router.get("/:id", function(req, res) {
	//find the campground with provided ID
	Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground) {
		if(err || !foundCampground) {
			req.flash("error", "Campground not found");
			res.redirect("back");
		} else {
			//render show template with that campground
			res.render("campgrounds/show", {campground: foundCampground});
		}
	}); 
	
	//res.send("This will be the show page one day!");
});

// EDIT CAMPGROUND ROUTE
router.get("/:id/edit", middleware.checkCampgroundOwnership, function(req, res) {
		Campground.findById(req.params.id, function(err, foundCampground) {
			res.render("campgrounds/edit", {campground: foundCampground});
		});	
});
// UPDATE CAMPGROUND ROUTE
router.put("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	//find and update the correct campground
	Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground) {
		if(err) res.redirect("/campgrounds");
		else {
			//redirect somewhere (Show page)
			res.redirect("/campgrounds/" + req.params.id);
		}
	});
	
});

// DESTROY CAMPGROUND ROUTE
router.delete("/:id", middleware.checkCampgroundOwnership, function(req, res) {
	//res.send("You are trying to delete something");
	Campground.findByIdAndRemove(req.params.id, function(err) {
		if(err) {
			res.redirect("/campgrounds");
		} else {
			res.redirect("/campgrounds");
		}
	});
});




module.exports = router;