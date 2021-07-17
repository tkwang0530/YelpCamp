const mongoose = require("mongoose");
// SCHEMA SETUP
const campgroundSchema = new mongoose.Schema({
	title: String,
	price: Number,
	image: String,
	description: String,
	location: String,
	geometry: {
		type: {
			type: String,
			enum: ['Point'],
			require: true
		},
		coordinates: {
			type: [Number],
			required: true
		}
	},
	createdAt: { type: Date, default: Date.now },
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "User"
	},
	comments: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: "Comment"
	}
	],
	reviews: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "Review"
		}
	],
	slug: {
		type: String,
		unique: true
	},
	rating: {
		type: Number,
		default: 0
	}
});

// add a slug before the campground gets saved to the database
campgroundSchema.pre('save', async function (next) {
	try {
		// check if a new campground is being saved, or if the campground's title is being modified
		if (this.isNew || this.isModified("title")) {
			console.log('this._id', this._id)
			console.log('this.title', this.title)
			this.slug = await generateUniqueSlug(this._id, this.title);
		}
		next();
	} catch (err) {
		next(err);
	}
});

const Campground = mongoose.model("Campground", campgroundSchema);

module.exports = Campground;

const generateUniqueSlug = async (id, campgroundName, slug) => {
	try {
		// generate the initial slug
		if (!slug) {
			slug = slugify(campgroundName);
		}
		// check if a campground with the slug already exists
		const campground = await Campground.findOne({ slug: slug });
		// check if a campground was not found or if the found campground is the current campground
		if (!campground || campground._id.equals(id)) {
			return slug;
		}
		// if not unique, generate a new slug
		const newSlug = slugify(campgroundName);
		// check again by calling the function recursively
		return await generateUniqueSlug(id, campgroundName, newSlug);
	} catch (err) {
		throw new Error(err);
	}
}

const slugify = (text) => {
	const slug = text.toString().toLowerCase()
		.replace(/\s+/g, '-')        // Replace spaces with -
		.replace(/[^\w\-]+/g, '')    // Remove all non-word chars
		.replace(/\-\-+/g, '-')      // Replace multiple - with single -
		.replace(/^-+/, '')          // Trim - from start of text
		.replace(/-+$/, '')          // Trim - from end of text
		.substring(0, 75);           // Trim at 75 characters
	return slug + "-" + Math.floor(1000 + Math.random() * 9000);  // Add 4 random digits to improve uniqueness
}
