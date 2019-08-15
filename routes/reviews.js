var express = require("express");
var router = express.Router({mergeParams: true});
var Campground = require("../models/campground");
var Review = require("../models/review");
var middleware = require("../middleware");

// Reviews Index
router.get("/", async (req, res) => {
    try {
        let campground = await Campground.findOne({ slug: req.params.slug }).populate({
            path: "reviews",
            options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
        }).exec();
    
        if(!campground) {
            req.flash("error", "campground not found");
            return res.redirect("back");
        }
    
        res.render("reviews/index", {campground: campground});
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("back");
    } 
});

// Reviews New
router.get("/new", middleware.isLoggedIn, middleware.checkReviewExistence, async (req, res) => {
    try {
        // middleware.checkReviewExistence checks if a user already reviewed the campground, only one review per user is allowed
        let campground = await Campground.findOne({slug: req.params.slug});
        res.render("reviews/new", {campground: campground});
    } catch (error) {
        console.log(error)
        req.flash("error", error.message);
        return res.redirect("back");
    }
});

// Reviews Create
router.post("/", middleware.isLoggedIn, middleware.checkReviewExistence, async (req, res) => {
    try {
        //lookup campground using ID
        let campground = await Campground.findOne({ slug: req.params.slug }).populate("reviews").exec();
        let review = await Review.create(req.body.review);

        //add author username/id and associated campground to the review
        review.author.id = req.user._id;
        review.author.username = req.user.username;
        review.campground = campground;
        //save review
        await review.save();
        await campground.reviews.push(review);
        // calculate the new average review for the campground
        campground.rating = await calculateAverage(campground.reviews);
        //save campground
        await campground.save();
        req.flash("success", "Your review has been successfully added.");
        res.redirect('/campgrounds/' + campground.slug);
    } catch (error) {
        req.flash("error", error.message);
        return res.redirect("back");
    }
});

// Reviews Edit
router.get("/:review_id/edit", middleware.checkReviewOwnership, async (req, res) => {
    try {
        let foundReview = await Review.findById(req.params.review_id);
        res.render("reviews/edit", {campground_slug: req.params.slug, review: foundReview});
    } catch (error) {
        console.log(error);
        req.flash("error", err.message);
        return res.redirect("back");
    }
});

// Reviews Update
router.put("/:review_id", middleware.checkReviewOwnership, async (req, res) => {
    try {
        let updatedReview = await Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true});
        let campground = await Campground.findOne({slug: req.params.slug}).populate("reviews").exec();
        //recalculate campground average rating
        campground.rating = await calculateAverage(campground.reviews);
        //save changes
        await campground.save();
        req.flash("success", "Your review was successfully edited.");
        res.redirect('/campgrounds/' + campground.slug);
    } catch (error) {
        console.log(error);
        req.flash("error", error.message);
        return res.redirect("back");
    }
});

// Reviews Delete
router.delete("/:review_id", middleware.checkReviewOwnership, async (req, res) => {
    try {
        await Review.findByIdAndRemove(req.params.review_id);
        let foundCampground = await Campground.findOne({ slug: req.params.slug });
        let campground = await Campground.findByIdAndUpdate(foundCampground._id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec();

        // recalculate campground average
        campground.rating = await calculateAverage(campground.reviews);
        //save changes
        await campground.save();
        req.flash("success", "Your review was deleted successfully.");
        res.redirect("/campgrounds/" + req.params.slug);
    } catch (error) {
        console.log(error)
        req.flash("error", error.message);
        return res.redirect("back");
    }
});

function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    var sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;