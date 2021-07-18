const mongoose = require("mongoose");
const Review = require('./review');
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = { toJSON: { virtuals: true } }

const campgroundSchema = new Schema({
	title: String,
	price: Number,
	image: [ImageSchema],
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

CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this._id}">${this.title}</a><strong>
    <p>${this.description.substring(0, 20)}...</p>`
});

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model("Campground", campgroundSchema);



