if(process.env.NODE_ENV != "production"){
    require("dotenv").config();
}

const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const { listingSchema, reviewSchema } = require("./schema.js");
const Review = require("./models/review.js");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const listingRouter = require("./routes/listing.js");
const reviewRouter = require("./routes/review.js");
const userRouter = require("./routes/user.js");
// const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlustThree";
const dbUrl = process.env.ATLASDB_URL;

main()
    .then(() => {
        console.log("Connected to MongoDB Atlas!");
    })
    .catch(err => {
        console.error("Error connecting to MongoDB:", err);
    });

async function main() {
    await mongoose.connect(dbUrl);
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.engine("ejs", ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

// app.get("/", (req, res) => {
//     res.send("Hi, I am root");
// })

// app.get("/testlisting",async (req,res)=>{
//     const sampleListing = new Listing({
//         title:"My village",
//         description:"By the Beach",
//         price:1200,
//         location:"Countugunt , Goa",
//         country:"India"
//     })
//    await sampleListing.save();
//    console.log("Sample was saved");
//    res.send("Sample is working");
// })

// // Index Route
// app.get("/listings", wrapAsync(async (req, res) => {
//     const allListings = await Listing.find({});
//     res.render("listings/index.ejs", { allListings });
// }));

// // New Route
// app.get("/listings/new", (req, res) => {
//     res.render("listings/new.ejs");
// })

// // Show Route
// app.get("/listings/:id", wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id).populate("reviews");
//     res.render("listings/show.ejs", { listing });
// }));

// // Create Route
// app.post("/listings", wrapAsync(async(req, res, next)=> {
//     if(!req.body.listing){
//         throw new ExpressError(400,"Send valid data for listing");
//     }
//     // let result = listingSchema.validate(req.body);
//     // console.log(result);
//     const newListing = new Listing(req.body.listing);
//     await newListing.save();
//     res.redirect("/listings");
// })
// );

// // Edit Route
// app.get("/listings/:id/edit", wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     const listing = await Listing.findById(id);
//     res.render("listings/edit.ejs", { listing });
// }));

// // Update Roue
// app.put("/listings/:id", wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     await Listing.findByIdAndUpdate(id, { ...req.body.listing });
//     res.redirect(`/listings/${id}`);
// }));

// // Delete Route
// app.delete("/listings/:id", wrapAsync(async (req, res) => {
//     let { id } = req.params;
//     let deleteListing = await Listing.findByIdAndDelete(id);
//     console.log(deleteListing);
//     res.redirect("/listings");
// }));

const sessionOptions = {
    secret:"mysupersecretstring",
    resave:false, 
    saveUninitialized:true,
    cookie:{
        expires: Date.now() + 7*24*60*60*1000,
        maxAge: 7*24*60*60*1000,
        httpOnly: true,
    },
}

app.use(session(sessionOptions));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next)=>{
    res.locals.success = req.flash("success");
    res.locals.error = req.flash("error");
    res.locals.currUser = req.user;
    next();
})

// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new User({
//         email:"example@gmail.com",
//         username:"student-delta",
//     })
//     let registeredUser = await User.register(fakeUser,"hello world!");
//     res.send(registeredUser);
// });

app.use("/listings", listingRouter);
app.use("/listings/:id/reviews", reviewRouter);
app.use("/",userRouter);

// // Review Route
// // Review Post Route
// app.post("/listings/:id/reviews", wrapAsync(async(req,res)=>{
//     let listing = await Listing.findById(req.params.id);
//     let newReview = new Review (req.body.review);

//     listing.reviews.push(newReview);

//     await newReview.save();
//     await listing.save();

//     res.redirect(`/listings/${listing._id}`);

// }));

// // Review Delete Route
// app.delete("/listings/:id/reviews/:reviewId",wrapAsync(async(req,res)=>{
//     let {id,reviewId} = req.params;
//     await Listing.findByIdAndUpdate(id,{$pull:{reviews:reviewId}});
//     await Review.findByIdAndDelete(reviewId);
//     res.redirect(`/listings/${id}`);
// }));



app.all("*", (req, res, next) => {
    next(new ExpressError(404, "Page Not Found!"));
})

app.use((err, req, res, next) => {
    let { statusCode = 500, message = "Something went Wrong" } = err;
    res.status(statusCode).render("error.ejs", { err });
    // res.status(statusCode).send(message);
});


app.listen(8080, () => {
    console.log("Server is listening on port 8080");
})
