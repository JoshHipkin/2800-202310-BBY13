require("dotenv").config();
require("./scripts/utils.js");
const session = require("express-session");
const express = require("express");
const Joi = require("joi");
const saltRounds = 12;
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;

const app = express();
const port = process.env.PORT || 3090;

const expire = 240 * 60 * 60 * 1000;

var { database } = include("dbConnection");

const userCollection = database.db(mongodb_database).collection("users");
const recipesCollection = database.db(mongodb_database).collection("recipes");

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));

var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/Recipal`,
    crypto: {
        secret: mongodb_session_secret,
    },
});


app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true
}));

app.get("/", (req, res) => {
    res.render('index');
});

app.get("/login", (req, res) => {
    res.render('login');
});

app.post('/loggingin', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().required();
    const validationResult = schema.validate(email);
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect('login');
        return;
    }

    const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1 }).toArray();

    if (result.length != 1) {
        console.log("Email not found");
        res.redirect('/login');
        return;
    }
    if (await bcrypt.compare(password, result[0].password)) {
        req.session.authenticated = true;
        req.session.email = email;
        req.session.cookie.maxAge = expire;

        res.redirect('/');
        return;
    }
    else {
        res.redirect('/login');
        return;
    }
});

app.get('/logout', (req,res) => {
	req.session.destroy();
    res.render("login");
});

app.get("/signup", (req, res) => {
    res.render('signup');
});

app.post('/createUser', async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    if (!req.body.email || req.body.email.trim() === '') {
        res.redirect('/signup');
        return;
    }

    if (!req.body.password || req.body.password.trim() === '') {
        res.redirect('/signup');
        return;
    }

    //Validating using Joi
    const schema = Joi.object(
        {
            email: Joi.string().max(20).required(),
            password: Joi.string().max(20).required()
        });

    const validationResultName = schema.validate({ email, password });
    if (validationResultName.error != null) {
        console.log(validationResultName.error);
        res.redirect('signup');
        return;
    }

    //Hashing Password
    var hashedPassword = await bcrypt.hash(password, 12);

    // Adds user to database
    await userCollection.insertOne({ email: email, password: hashedPassword });

    //authenticating session
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expire;

    res.redirect('/');
});

app.get("/profile", async (req, res) => {
    if (!req.session.authenticated){
        res.redirect("/login");
        return;
    }
    const email = req.session.email;
    const result = await userCollection.find({ email: email }).project({ password: 1, _id: 1 }).toArray();
    let password = result[0].password;
    let id = result[0]._id;
    let user = [id, email, password];

    res.render('profile', { user: user });
});


// display recipes and limit recipes on homepage 

app.get("/home", async (req, res) => {
    const searchQuery = req.query.q;
    const searchIngredients = searchQuery ? searchQuery.split(",") : [];
    const page = parseInt(req.query.page) || 1; // Get the page number from the query parameter
  
    const recipesPerPage = 20;
    const skip = (page - 1) * recipesPerPage;
  
    const query = searchIngredients.length > 0
    ? { ingredients: { $all: searchIngredients.map(ingredient => new RegExp(ingredient, "i")) } }
    : {};

    const countPromise = recipesCollection.countDocuments(query);

    const recipesPromise = recipesCollection
      .find(query)
      .project({ name: 1, description: 1, servings: 1, _id: 1, ingredients: 1 })
      .skip(skip)
      .limit(recipesPerPage)
      .toArray();
  
    

    const [recipeCount, recipeData] = await Promise.all([countPromise, recipesPromise]);
  
    const pageCount = Math.ceil(recipeCount / recipesPerPage);
    const maxButtons = 10;
    const visiblePages = 5;
    const halfVisiblePages = Math.floor(visiblePages / 2);
    let startPage = Math.max(1, page - halfVisiblePages);
    let endPage = Math.min(startPage + visiblePages - 1, pageCount);
  
    if (endPage - startPage + 1 < visiblePages) {
      startPage = Math.max(1, endPage - visiblePages + 1);
    }
  
    const pages = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  
    res.render("homepage", {
      recipe: recipeData,
      currentPage: page,
      pageCount: pageCount,
      pages: pages,
      maxButtons: maxButtons,
      visiblePages: visiblePages,
      startPage: startPage,
      searchQuery: searchQuery,
      searchIngredients: searchIngredients
    });
  });


app.listen(port, () => {
    console.log("Listening on port " + port);
});
