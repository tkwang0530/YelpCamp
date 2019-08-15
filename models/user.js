var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");

var UserSchema = mongoose.Schema({
	username: {type: String, unique: true, required: true},
	password: String,
	avatar: String,
	lastName: String,
	firstName: String,
	email: {type: String, unique: true, required: true},
	resetPasswordToken: String,
  	resetPasswordExpires: Date,
	isAdmin: {type: Boolean, default: false}
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);