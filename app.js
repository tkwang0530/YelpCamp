//Dotenv
require('dotenv').config();

const express     = require("express");
const passport    = require("passport");
const LocalStrategy = require("passport-local");

const mongoose       = require('mongoose');
const flash          = require("connect-flash");
const bodyParser     = require("body-parser");
const Campground     = require("./models/campground");
const seedDB 	     = require("./seeds");
const methodOverride = require("method-override");
const Comment        = require("./models/comment");
const User           = require("./models/user");
const app            = express();

//Requiring Routes
var commentRoutes    = require("./routes/comments"),
	campgroundRoutes = require("./routes/campgrounds"),
	indexRoutes      = require("./routes/index");


app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require("moment");
//seedDB(); seed the database


//"mongodb://localhost:27017/yelp_camp"
var url = process.env.DATABASEURL || "mongodb://localhost:27017/yelp_camp";
mongoose.connect(url, {
	useNewUrlParser: true,
	useCreateIndex: true //Maybe we don't need this line??
}).then(() => {
	console.log('Connected to DB!');
}).catch(err => {
	console.log('ERROR:', err.message);
});

// mongoose.connect("mongodb://localhost:27017/yelp_camp", {
// 	useNewUrlParser: true,
// 	useCreateIndex: true //Maybe we don't need this line??
// }).then(() => {
// 	console.log('Connected to DB!');
// }).catch(err => {
// 	console.log('ERROR:', err.message);
// });

// PASSPORT CONFIGURATION
app.use(require("express-session")({
	secret: "Once again, Rusty wins cutest dog",
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next) {
	res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
	next();
});

app.use("/", indexRoutes);
app.use("/campgrounds", campgroundRoutes);
app.use("/campgrounds/:id/comments", commentRoutes);




// app.listen(3000, () => {
// 	console.log('The YelpCamp server has started');
// });
app.listen(process.env.PORT, process.env.IP, function() {
	console.log("The YelpCamp Server has started!");
});
