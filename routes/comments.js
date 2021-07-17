const express = require("express");
const router = express.Router({ mergeParams: true });
const Campground = require("../models/campground");
const Comment = require("../models/comment");
const middleware = require("../middleware");

//Comment New
router.get("/new", middleware.isLoggedIn, async (req, res) => {
	//Find campground by ID
	try {
		const campground = await Campground.findOne({ slug: req.params.slug });
		res.render("comments/new", { campground: campground });
	} catch (error) {
		console.log(error);
	}
});

//Comment Create
router.post("/", middleware.isLoggedIn, async (req, res) => {
	try {
		//lookup campground using ID
		const campground = await Campground.findOne({ slug: req.params.slug });
		const comment = await Comment.create(req.body.comment);

		//add username and id to comment
		comment.author.id = req.user._id;
		comment.author.username = req.user.username;
		//save comment
		await comment.save();
		//connect new comment to campground
		await campground.comments.push(comment);
		await campground.save();
		//redirect campground show page
		req.flash("success", "Successfully added comment");
		res.redirect("/campgrounds/" + campground.slug);
	} catch (error) {
		console.log(error);
		req.flash("error", err.message);
		res.redirect("/campgrounds");
	}
});

// COMMENT EDIT ROUTE
router.get("/:comment_id/edit", middleware.checkCommentOwnership, async (req, res) => {
	try {
		const foundComment = Comment.findById(req.params.comment_id);
		res.render("comments/edit", { campground_slug: req.params.slug, comment: foundComment });
	} catch (error) {
		console.log(error);
		req.flash("error", error.message);
		res.redirect("back");
	}
});

// COMMENT UPDATE ROUTE
router.put("/:comment_id", middleware.checkCommentOwnership, async (req, res) => {
	try {
		await Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment);
		req.flash("success", "successfully update comment");
		res.redirect("/campgrounds/" + req.params.slug);
	} catch (error) {
		console.log(error);
		req.flash("error", error.message);
		res.redirect("back");
	}
});

// COMMENT DESTROY ROUTE
router.delete("/:comment_id", middleware.checkCommentOwnership, async (req, res) => {
	try {
		await Comment.findByIdAndRemove(req.params.comment_id);
		req.flash("success", "Comment deleted");
		res.redirect("/campgrounds/" + req.params.slug);
	} catch (error) {
		console.log(error);
		req.flash("error", error.message);
		res.redirect("back");
	}
});


module.exports = router;