require("dotenv").config();
require("./utils.js");
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
const port = process.env.PORT || 6000;

const expire = 240 * 60 * 60 * 1000;

var {database} = include("dbConnection");

const userCollection = database.db(mongodb_database).collection("users");
//const recipes = database.db(mongodb_database).collection("recipes");

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
    if (!req.session.authenticated) {
    var html = `<h1>Hello World</h1>`;
    res.send(html);
    }
});