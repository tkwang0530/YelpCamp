const mongoose = require("mongoose");
const passportLocalMongoose = require("passport-local-mongoose");

const UserSchema = mongoose.Schema({
	username: { type: String, unique: true, required: true },
	password: String,
	avatar: String,
	lastName: String,
	firstName: String,
	email: { type: String, unique: true, required: true },
	resetPasswordToken: String,
	resetPasswordExpires: Date,
	isAdmin: { type: Boolean, default: false }
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);