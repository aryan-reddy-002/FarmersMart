const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const session = require("express-session");

const Joi = require("joi");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const Order = require("./models/order.js")
const crypto = require("crypto");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const { marked } = require("marked");
if(process.env.NODE_ENV != "production"){
require('dotenv').config();
}


const Review = require("./models/review.js");
const Product = require("./models/product.js");
const ExpressError = require("./utils/ExpressError.js");
const wrapAsync = require("./utils/wrapasync.js");
const reviewJoiSchema = require("./reviewJoiSchema.js")
const productJoiSchema = require("./productJoiSchema")
const products = require("./routes/products.js");
const orders = require("./routes/orders");
var flash = require('connect-flash');



app.set("view engine","ejs");
app.set("views", path.join(__dirname,"views"));
app.engine("ejs", ejsMate);

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.use(express.static(path.join(__dirname,"public")));


app.use(async (req, res, next) => {
  try {
    const products = await Product.find({});

    const categories = [...new Set(products.map(p => p.category))];

    const catImages = {};
    products.forEach(p => {
      if (p.image && p.image.url && !catImages[p.category]) {
        catImages[p.category] = p.image;
      }
    });

    res.locals.categories = categories;
    res.locals.catImages = catImages;

    return next();  
  } catch (err) {
    return next(err); 
  }
});



app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req, res, next) => {
    res.locals.success = req.flash("success") || [];
    res.locals.error = req.flash("error") || [];
    next();
});




app.use((req,res,next)=>{
    res.locals.username = req.user ? req.user.username : null; 
    res.locals.role = req.user ? req.user.role : null;
    res.locals.currUser = req.user || null;
    res.locals.cartItems = req.session.cartItems|| [];

  next();
})

app.use((req,res,next)=>{
  res.locals.errmsg = req.flash("failure");
  res.locals.loginerror = req.flash("error");
  next();
})



const dburl = process.env.ATLASDB_URL;

mongoose.connect(dburl)
.then(()=> console.log(" Mongo Connected"))
.catch(err=>{
  console.error(" Mongo connection error:", err);
  process.exit(1);
});



app.use((req, res, next) => {
    res.locals.msg = req.flash("success"); 
    next();
});

const axios = require("axios");


app.get("/", (req,res)=>{
  res.redirect("/products");
});

app.use("/products",products);

app.use("/orders", orders);

const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();


const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });



app.post("/ask-gpt", async (req, res) => {
  try {
    const userPrompt = req.body.quest;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [{
        role: "user",
        parts: [{ text: `
            You are FarmersGPT, the AI assistant for the FarmersMart e-commerce platform.

Your role is STRICT:

* ONLY respond to queries related to **food, dishes, ingredients, or recipes**.
* If the user asks anything unrelated (e.g., coding, weather, general questions), respond with:
  👉 "Please ask queries related to food and recipes only."

---

If the query is related to food or recipes:

Provide a clean, structured recipe for: "${userPrompt}"

STRICT FORMATTING RULES:

* Start with a Title: "### 🌿 [Recipe Name]"
* Section 1: "🛒 **Ingredients Checklist**" (Use bullet points)
* Section 2: "👨‍🍳 **Step-by-Step Instructions**" (Use a numbered list)
* Section 3: "💡 **Farmer's Tip**" (One short sentence about choosing fresh produce)

CONSTRAINTS:

* No introductory text (Do NOT say "Sure, here is your recipe")
* No concluding text (Do NOT say "Enjoy your meal")
* Use bold text for key ingredients
* Keep it concise and professional

        ` }]
      }]
    });

    const formattedAnswer = marked(response.text);

    return res.json({ answer: formattedAnswer }); 

  } catch (error) {
    console.error(error);
    return res.status(500).send("AI error"); 
  }
});



app.get("/signup",(req,res)=>{
res.render("products/signup.ejs");
});

app.post("/signup", wrapAsync(async (req, res, next) => {
    try {
        const { username, email, address, phoneNumber, password } = req.body.User;

        const newUser = new User({ 
            username, 
            email, 
            address, 
            phoneNumber 
        });

        const registeredUser = await User.register(newUser, password);

        req.login(registeredUser, (err) => {
            if (err) return next(err);  
            return res.redirect("/products"); 
        });

    } catch (e) {
        console.log("Signup Error:", e.message);
        req.flash("failure","please enter your details correct way ");
        return res.redirect("/signup"); 
    }
}));

app.get("/login",(req,res)=>{
  res.render("products/login.ejs");
});




const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS  
    }
});




app.post(
  "/login",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: "invalid username or password Please Try again"
  }),
  (req, res) => {
    req.flash("success", "Welcome Back To FarmersMart");
    return res.redirect("/products"); 
});

app.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.flash("success","Logout Successfully!!");
    return res.redirect("/products");
  });
});



app.use((req,res,next)=>{
  console.log("404:", req.originalUrl); 

  if (req.originalUrl.includes("favicon")) {
    return res.sendStatus(204);
  }

  next(new ExpressError(404,"Page Not Found!!"));
});



app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);   
  }

  console.error(err);

  const { status = 500, message = "Something went wrong" } = err;

  return res.status(status).render("products/error.ejs", {
    status,
    message
  });
});





app.listen(8080, ()=>{
  console.log(" listening to port 8080");
});




