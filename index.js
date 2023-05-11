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
//const recipes = database.db(mongodb_database).collection("recipes");

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use(express.static('scripts'));


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
    const result = await userCollection.find({ email: email }).project({ password: 1, _id: 1, email: 1 }).toArray();

    res.render('profile', { tabContent: 'profile-info', user: result });
});

app.get("/profile/preferences", async (req, res) => {
    if (!req.session.authenticated) {
        res.redirect("/login");
        return;
    }
    const email = req.session.email;
    const result = await userCollection.find({email: email})
    .project({allergens: 1, diet: 1, username: 1})
    .toArray();
    res.render('profile', {tabContent: 'preferences', user: result[0]});
});

app.post("/savePreferences", async (req, res) => {
    const allergies = req.body.allergy;
    const diet = req.body.diet;
    console.log(allergies);
    //Creating a new array without any empty strings
    const filteredAllergies = allergies.filter((allergy) => allergy !== '');
    try {
        await userCollection.updateOne(
            { email: req.session.email },
            { $push: {
                allergens: { $each: filteredAllergies },
                diet: diet
            }
        }
        );
        res.render('preferencesSaved');
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to save preferences");
    }
});

app.post("/preferences/delete", async (req, res) => {
    const email = req.session.email;
    const type = req.body.type;
    const value = req.body.value;
    let updateField = null;

    if (type === "allergens") {
        updateField = { $pull: { allergens: value} };
    } else if (type === "diet") {
        updateField = { $pull: { diet: value } };
    } else {
        res.status(400).send("Invalid type parameter");
        return;
    }

    try {
        await userCollection.updateOne({ email: email }, updateField);
        res.redirect("/profile/preferences");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed to delete value");
    }
});

app.listen(port, () => {
    console.log("Listening on port " + port);
});
