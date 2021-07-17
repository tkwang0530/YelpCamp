const Campground = require("../models/campground");
const Comment = require("../models/comment");
const Review = require("../models/review");
// all the middleware goes here
const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (req, res, next) => {
	// is user logged in
	if (req.isAuthenticated()) {
		Campground.findOne({ slug: req.params.slug }, (err, foundCampground) => {
			if (err || !foundCampground) {
				req.flash("error", "Campground not found");
				res.redirect("back");
			} else {
				//does user own the campground
				if (foundCampground.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkCommentOwnership = (req, res, next) => {
	// is user logged in
	if (req.isAuthenticated()) {
		Comment.findById(req.params.comment_id, (err, foundComment) => {
			if (err || !foundComment) {
				req.flash("error", "Comment not found");
				res.redirect("back");
			} else {
				//does user own the comment
				if (foundComment.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	req.flash("error", "You need to be logged in to do that");
	res.redirect("/login");
};

middlewareObj.checkReviewOwnership = (req, res, next) => {
	if (req.isAuthenticated()) {
		Review.findById(req.params.review_id, (err, foundReview) => {
			if (err || !foundReview) {
				res.redirect("back");
			} else {
				// does user own the comment?
				if (foundReview.author.id.equals(req.user._id) || req.user.isAdmin) {
					next();
				} else {
					req.flash("error", "You don't have permission to do that");
					res.redirect("back");
				}
			}
		});
	} else {
		req.flash("error", "You need to be logged in to do that");
		res.redirect("back");
	}
};

middlewareObj.checkReviewExistence = (req, res, next) => {
	if (req.isAuthenticated()) {
		Campground.findOne({ slug: req.params.slug }).populate("reviews").exec(function (err, foundCampground) {
			if (err || !foundCampground) {
				req.flash("error", "Campground not found.");
				res.redirect("back");
			} else {
				// check if req.user._id exists in foundCampground.reviews
				const foundUserReview = foundCampground.reviews.some(function (review) {
					return review.author.id.equals(req.user._id);
				});
				if (foundUserReview) {
					req.flash("error", "You already wrote a review.");
					return res.redirect("/campgrounds/" + foundCampground.slug);
				}
				// if the review was not found, go to the next middleware
				next();
			}
		});
	} else {
		req.flash("error", "You need to login first.");
		res.redirect("back");
	}
};
module.exports = middlewareObj;