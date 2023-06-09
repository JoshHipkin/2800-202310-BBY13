//All reqiure statements
require("dotenv").config();
require("./scripts/utils.js");
const session = require("express-session");
const express = require("express");
const Joi = require("joi");
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
const multer = require("multer");
// configure multer for handling file uploads
const upload = multer({ dest: "uploads/" });
const fs = require("fs");
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();
const { Configuration, OpenAIApi } = require("openai");
// Salt rounds for bcrypt password hashing
const saltRounds = 12;
// For generating random id's
const { v4: uuidv4 } = require("uuid");
const he = require("he");

/* Secrets */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const clarifai_secret = process.env.CLARIFAI_SECRET;
const openai_secret = process.env.OPENAI_SECRET;

//OpenAI
const configuration = new Configuration({
  apiKey: openai_secret,
});
const openai = new OpenAIApi(configuration);

//Express
const app = express();
//hosting port
const port = process.env.PORT || 3090;

//session expire time
const expire = 60 * 60 * 60 * 1000;

// mongodb connection
var { database } = include("dbConnection");

//accessing user collection
const userCollection = database.db(mongodb_database).collection("users");
//accessing recipe collection
const recipesCollection = database.db(mongodb_database).collection("recipes");
//accessing comment collection
const commentCollection = database.db(mongodb_database).collection("comments");
//accessing recipeUpload collection
const recipeUploadCollection = database
  .db(mongodb_database)
  .collection("recipeUpload");
//accessing pantry collection
const pantryCollection = database.db(mongodb_database).collection("pantry");

/* setting up file usage */
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));
app.use("/public/images/", express.static("./public/images"));
app.use("/json", express.static("./json"));
app.use("/styles", express.static("./styles"));
app.use(express.static("./scripts"));

// use for session storage
var mongoStore = MongoStore.create({
  mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/Recipal`,
  crypto: {
    secret: mongodb_session_secret,
  },
});

function isValidSession(req) {
  if (req.session.authenticated) {
    return true;
  }
  return false;
}

function sessionValidation(req, res) {
  if (!isValidSession(req)) {
    res.redirect("/login");
  }
}

// use node session
app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
  })
);

// landing page
app.get("/", (req, res) => {
  if (isValidSession(req)) {
    res.redirect("/home");
    return;
  }
  res.render("index");
});

//login page
app.get("/login", (req, res) => {
  res.render("login");
});

// processing login request
app.post("/loggingin", async (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  const schema = Joi.string().required();
  const validationResult = schema.validate(email);
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.render("login-invalid");
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ email: 1, password: 1, _id: 1 })
    .toArray();

  if (result.length != 1) {
    console.log("Email not found");
    res.render("login-invalid");
    return;
  }
  if (await bcrypt.compare(password, result[0].password)) {
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expire;

    res.redirect("/home");
    return;
  } else {
    res.render("login-invalid");
    return;
  }
});

// perform logout, and delete session
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/home");
});

//sign up page
app.get("/signup", (req, res) => {
  res.render("signup");
});

//Process new user signup
app.post("/createUser", async (req, res) => {
  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;

  if (!req.body.username || req.body.username.trim() === "") {
    res.redirect("/signup");
    return;
  }

  if (!req.body.email || req.body.email.trim() === "") {
    res.redirect("/signup");
    return;
  }

  if (!req.body.password || req.body.password.trim() === "") {
    res.redirect("/signup");
    return;
  }

  //Validating using Joi
  const schema = Joi.object({
    username: Joi.string().alphanum().max(20).required(),
    email: Joi.string().max(20).required(),
    password: Joi.string().max(20).required(),
  });

  const validationResultName = schema.validate({ username, email, password });
  if (validationResultName.error != null) {
    console.log(validationResultName.error);
    res.redirect("/signup");
    return;
  }

  //Hashing Password
  var hashedPassword = await bcrypt.hash(password, 12);

  const allergens = [];
  const diet = [];
  const shoppinglist = [];
  var result = await userCollection.find({ email: email }).toArray();

  if (result.length == 0) {
    await userCollection.insertOne({
      username: username,
      email: email,
      password: hashedPassword,
      allergens: allergens,
      diet: diet,
      shoppinglist: shoppinglist,
      favourite: [],
    });
  } else {
    res.render("signupEmailTaken");
    return;
  }

  //authenticating session
  req.session.authenticated = true;
  req.session.email = email;
  req.session.cookie.maxAge = expire;

  res.redirect("security");
});

// prompting for security questions
app.get("/security", async (req, res) => {
  res.render("security");
});

//processing user security questions, insert into database
app.post("/securityRecovery", async (req, res) => {
  var securityPassword = req.body.securityPassword;
  var securityQuestion = req.body.securityQuestion;
  console.log(req.body);

  if (!req.body.securityPassword || req.body.securityPassword.trim() === "") {
    res.redirect("/security");
    return;
  }

  const schema = Joi.object({
    securityPassword: Joi.string().max(20).required(),
  });

  const validationResultName = schema.validate({ securityPassword });
  if (validationResultName.error != null) {
    console.log(validationResultName.error);
    res.redirect("security");
    return;
  }

  var hashedPassword = await bcrypt.hash(securityPassword, 12);

  await userCollection.updateOne(
    { email: req.session.email },
    { $set: { securityPassword: hashedPassword } }
  );
  await userCollection.updateOne(
    { email: req.session.email },
    { $set: { securityQuestion: securityQuestion } }
  );

  res.redirect("/signupDiet");
});

//Ask user to add preferences on signup
app.get("/signupDiet", (req, res) => {
  res.render("signupDiet");
});

//post users preferences
app.post("/userDiet", async (req, res) => {
  var diet = req.body.diet;
  console.log(diet);
  await userCollection.updateOne(
    { email: req.session.email },
    { $push: { diet: diet } }
  );
  res.redirect("/signupAllergens");
});

app.get("/signupAllergens", (req, res) => {
  res.render("signupAllergens");
});

app.post("/userAllergens", async (req, res) => {
  const allergies = req.body.allergy;
  const filteredAllergies = allergies.filter((allergy) => allergy !== "");
  try {
    const updateQuery = { $push: { allergens: { $each: filteredAllergies } } };
    await userCollection.updateOne({ email: req.session.email }, updateQuery);
    res.redirect("/home");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save preferences");
  }
});

//password reset page
app.get("/forgot", async (req, res) => {
  res.render("forgot");
});

app.post("/forgotLogin", async (req, res) => {
  var email = req.body.email;

  if (!req.body.email || req.body.email.trim() === "") {
    res.render("forgotInvalid");
    return;
  }

  const schema = Joi.string().required();
  const validationResult = schema.validate(email);
  if (validationResult.error != null) {
    console.log(validationResult.error);
    res.render("forgotInvalid");
    return;
  }

  const result = await userCollection
    .find({ email: email })
    .project({ securityQuestion: 1, securityPassword: 1, _id: 1 })
    .toArray();

  if (result.length != 1) {
    res.render("forgotInvalid");
    return;
  }

  let sQuestion = result[0].securityQuestion;
  let sPassword = result[0].securityPassword;
  let account = [sQuestion, sPassword];

  req.session.email = email;

  var question = "";
  if (sQuestion == 1) {
    question = "What is the middle name of your youngest child?";
  } else if (sQuestion == 2) {
    question = "What is name of your first stuffed animal?";
  } else if (sQuestion == 3) {
    question = "What city/town did your mother and father meet?";
  }

  res.render("verify", { account: account, question });
});

// Verifying security question password for resetting password.
app.post("/securityPasswordVerify", async (req, res) => {
  var password = req.body.password;

  email = req.session.email;
  const result = await userCollection
    .find({ email: email })
    .project({ securityQuestion: 1, securityPassword: 1, _id: 1 })
    .toArray();

  let sQuestion = result[0].securityQuestion;

  var question = "";
  if (sQuestion == 1) {
    question = "What is the middle name of your youngest child?";
  } else if (sQuestion == 2) {
    question = "What is name of your first stuffed animal?";
  } else if (sQuestion == 3) {
    question = "What city/town did your mother and father meet?";
  }

  const schema = Joi.object({
    password: Joi.string().max(20).required(),
  });

  const validationResultName = schema.validate({ password });
  if (validationResultName.error != null) {
    console.log(validationResultName.error);
    res.render("verifyInvalid", { question });
    return;
  }

  if (await bcrypt.compare(password, result[0].securityPassword)) {
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expire;

    res.render("changePassword");
    return;
  } else {
    res.render("verifyInvalid", { question });
  }
});

//Reset the users password
app.post("/securityChangePassword", async (req, res) => {
  var password = req.body.password;

  if (!req.body.password || req.body.password.trim() === "") {
    res.render("changePassword");
    return;
  }

  const schema = Joi.object({
    password: Joi.string().max(20).required(),
  });

  const validationResultName = schema.validate({ password });
  if (validationResultName.error != null) {
    console.log(validationResultName.error);
    res.render("changePassword");
    return;
  }

  var hashedPassword = await bcrypt.hash(password, 12);

  await userCollection.updateOne(
    { email: req.session.email },
    { $set: { password: hashedPassword } }
  );

  res.redirect("/home");
});

//Display users' profile page
app.get("/profile", async (req, res) => {
  sessionValidation(req, res);

  const email = req.session.email;
  const result = await userCollection
    .find({ email: email })
    .project({ username: 1, password: 1, _id: 1, email: 1 })
    .toArray();

  res.render("profile", {
    tabContent: "profile-info",
    user: result[0],
    pantry: null,
  });
});

//Preferences tab for user profile page
app.get("/profile/preferences", async (req, res) => {
  sessionValidation(req, res);

  const email = req.session.email;
  const result = await userCollection
    .find({ email: email })
    .project({ allergens: 1, diet: 1, username: 1 })
    .toArray();

  res.render("profile", {
    tabContent: "preferences",
    user: result[0],
    pantry: null,
  });
});

//Pantry tab for user profile page
app.get("/profile/pantry", async (req, res) => {
  const email = req.session.email;
  const result = await userCollection
    .find({ email: email })
    .project({ username: 1, password: 1, _id: 1, email: 1 })
    .toArray();
  const result2 = await pantryCollection
    .find({ email: email })
    .project({ item: 1 })
    .toArray();

  res.render("profile", {
    tabContent: "pantry",
    user: result[0],
    pantry: result2,
  });
});

//Saves ingredient input to user pantry
app.post("/savePantry", async (req, res) => {
  const email = req.session.email;
  const pantry = req.body.pantry;

  await pantryCollection.insertOne({ email: email, item: pantry });

  res.redirect("/profile/pantry");
});

//Delete item from user pantry
app.post("/deletePantry", async (req, res) => {
  const email = req.session.email;
  const item = req.body.item;

  pantryCollection.deleteOne({ email: email, item: item });

  res.redirect("/profile/pantry");
});

//Save the users dietary and
app.post("/savePreferences", async (req, res) => {
  const allergies = req.body.allergy;
  const diet = req.body.diet;
  console.log(allergies);
  //Creating a new array without any empty strings
  const filteredAllergies = allergies.filter((allergy) => allergy !== "");
  try {
    const updateQuery = { $push: { allergens: { $each: filteredAllergies } } };
    if (diet.length > 0) {
      updateQuery.$push.diet = diet;
    }
    await userCollection.updateOne({ email: req.session.email }, updateQuery);
    res.render("preferencesSaved");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to save preferences");
  }
});

//Delete either allergen or diet restriction from profile.
app.post("/preferences/delete", async (req, res) => {
  const email = req.session.email;
  const type = req.body.type;
  const value = req.body.value;
  let updateField = null;

  if (type === "allergens") {
    updateField = { $pull: { allergens: value } };
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

//HomePage
app.get("/home", async (req, res) => {
  const searchQuery = req.query.q;

  const query = {}; // You can customize the query to filter specific recipes if needed

  try {
    const [recipeCount, recipeData] = await Promise.all([
      recipeUploadCollection.countDocuments(query),
      recipeUploadCollection
        .find(query)
        .project({
          name: 1,
          servings: 1,
          ingredients: 1,
          steps: 1,
          description: 1,
          _id: 1,
        })
        .toArray(),
    ]);

    var headerSession = "";
    if (!isValidSession(req)) {
      headerSession = "BeforeLogin";
    }

    res.render("homepage", {
      headerSession,
      searchQuery,
      recipe: recipeData,
    });
  } catch (error) {
    console.error("Error retrieving recipe data:", error);
    // Handle the error accordingly
    res.render("errorPage");
  }
});

//Search page with recipes and search query
app.get("/search", async (req, res) => {
  const userEmail = req.session.email;
  const user = await userCollection.findOne({ email: req.session.email });

  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }
  //array for passing names for checkboxes
  const availableOptions = [
    "dinner",
    "dessert",
    "lunch",
    "breakfast",
    "appetizer",
    "low-calorie",
  ];

  if (isValidSession(req)) {
    var allergens = user.allergens;
    var diet = user.diet;
  }

  //array for passing checkbox filters into ejs
  const meal = ["dinner", "dessert", "lunch", "breakfast", "appetizer"];
  const cuisine = [
    "italian",
    "mexican",
    "caribbean",
    "french",
    "moroccan",
    "english",
    "southern",
    "indian",
  ];
  const dietType = [
    "gluten-free",
    "vegan",
    "vegetarian",
    "low-sodium",
    "low-calorie",
    "low-fat",
    "low-carb",
  ];
  const excludeDiet = req.query.excludeDiet === "on";
  console.log(excludeDiet);
  const mealFilter = req.query.m;
  const cuisineFilter = req.query.c;
  const searchQuery = req.query.q;
  const searchTerm = req.query.q;
  var dietFilter = [];

  //  ensuring filters are stored in an array
  if (!excludeDiet) {
    dietFilter = diet ? [...diet] : [];
  }
  console.log(dietFilter);
  if (Array.isArray(req.query.d)) {
    dietFilter.push(...req.query.d);
  } else if (req.query.d) {
    dietFilter.push(req.query.d);
  }
  console.log(dietFilter);
  const selectedCategories = [];

  if (mealFilter) {
    if (Array.isArray(mealFilter)) {
      selectedCategories.push(...mealFilter);
    } else {
      selectedCategories.push(mealFilter);
    }
  }

  if (cuisineFilter) {
    if (Array.isArray(cuisineFilter)) {
      selectedCategories.push(...cuisineFilter);
    } else {
      selectedCategories.push(cuisineFilter);
    }
  }
  if (dietFilter) {
    if (Array.isArray(dietFilter)) {
      selectedCategories.push(...dietFilter);
    } else {
      selectedCategories.push(dietFilter);
    }
  }

  const searchIngredients = searchQuery ? searchQuery.split(",") : [];
  const page = parseInt(req.query.page) || 1;
  const recipesPerPage = 20;
  const skip = (page - 1) * recipesPerPage;

  //Easter Egg
  var conrad = false;
  var bread = false;
  for (let i = 0; i < searchIngredients.length; i++) {
    let currIngredient = searchIngredients[i].trim().toLowerCase();
    if (currIngredient === "conrad") {
      conrad = true;
    }
    if (currIngredient === "bread") {
      bread = true;
    }
    if (conrad && bread) {
      res.render("conrad", { headerSession });
      return;
    }
  }

  /*Define Query for recipe database */

  const query = {};

  if (mealFilter && mealFilter.length > 0) {
    let termQuery;
    if (Array.isArray(mealFilter)) {
      termQuery = mealFilter.map((term) => ({
        search_terms: new RegExp(term, "i"),
      }));
    } else {
      termQuery = [{ search_terms: new RegExp(mealFilter, "i") }];
    }
    query.$and = query.$and || [];
    query.$and.push({ $or: termQuery });
  }

  if (cuisineFilter && cuisineFilter.length > 0) {
    let termQuery;
    if (Array.isArray(cuisineFilter)) {
      termQuery = cuisineFilter.map((term) => ({
        search_terms: new RegExp(term, "i"),
      }));
    } else {
      termQuery = [{ search_terms: new RegExp(cuisineFilter, "i") }];
    }
    query.$and = query.$and || [];
    query.$and.push({ $or: termQuery });
  }

  if (searchTerm && searchTerm.length > 0) {
    const recipeQuery = { name: { $regex: new RegExp(searchTerm, "i") } };
    query.$or = query.$and || [];
    query.$or.push(recipeQuery);
  }

  if (searchIngredients.length > 0) {
    const ingredientQueries = searchIngredients.map((ingredient) => ({
      ingredients: { $regex: new RegExp(ingredient, "i") },
    }));
    query.$or = query.$or || [];
    query.$or.push({ $and: ingredientQueries });
  }

  if (allergens && allergens.length > 0) {
    const allergenQuery = allergens.map((allergen) => ({
      ingredients: { $not: new RegExp(allergen, "i") },
    }));
    query.$and = query.$and || [];
    query.$and.push({ $and: allergenQuery });
  }

  if (dietFilter && dietFilter.length > 0) {
    const dietQuery = dietFilter.map((tag) => ({
      search_terms: { $regex: new RegExp(tag, "i") },
    }));
    query.$and = query.$and || [];
    query.$and.push({ $and: dietQuery });
  }

  const countPromise = recipesCollection.countDocuments(query);

  /* End of recipe query */

  const recipesPromise = recipesCollection
    .find(query)
    .project({ name: 1, description: 1, servings: 1, _id: 1, ingredients: 1 })
    .skip(skip)
    .limit(recipesPerPage)
    .toArray();

  const [recipeCount, recipeData] = await Promise.all([
    countPromise,
    recipesPromise,
  ]);

  const pageCount = Math.ceil(recipeCount / recipesPerPage);
  const maxButtons = 10;
  const visiblePages = 5;
  const halfVisiblePages = Math.floor(visiblePages / 2);
  let startPage = Math.max(1, page - halfVisiblePages);
  let endPage = Math.min(startPage + visiblePages - 1, pageCount);

  if (endPage - startPage + 1 < visiblePages) {
    startPage = Math.max(1, endPage - visiblePages + 1);
  }

  //recieved all ratings
  var ratings = await commentCollection
    .find({})
    .project({ rating: 1, recipeID: 1 })
    .toArray();

  //filters the ratings
  var filteredRatings = [];
  for (count = 0; ratings.length > count; count++) {
    //ignores all null or empty ratings
    if (!(ratings[count].rating == null)) {
      //compares filteredRatings array object to object in ratings array
      if (filteredRatings.some((e) => e.recipeID == ratings[count].recipeID)) {
        key = "recipeID";
        value = ratings[count].recipeID;

        //Function to find index based off key and value developed by ChatGPT
        function findIndex(array, key, value) {
          for (let index = 0; index < array.length; index++) {
            const obj = array[index];
            if (obj.hasOwnProperty(key) && obj[key] === value) {
              return index;
            }
          }
        }

        objIndex = findIndex(filteredRatings, key, value);

        //Adds integer of rating together and total amount of ratings for average calculation later on
        filteredRatings[objIndex].rating =
          parseInt(filteredRatings[objIndex].rating) +
          parseInt(ratings[count].rating);
        filteredRatings[objIndex].ratingTotal =
          parseInt(filteredRatings[objIndex].ratingTotal) + parseInt(1);
      } else {
        //If there is no unique recipeID in filtered ratings array, the object is added
        filteredRatings.push({
          recipeID: ratings[count].recipeID,
          rating: parseInt(ratings[count].rating),
          ratingTotal: parseInt(1),
        });
      }
    }
  }

  recipeData.forEach((recipe) => {
    recipe.name = he.decode(recipe.name); // fixes html encoding issue
    if (recipe.description && recipe.description.length > 160) {
      recipe.description = recipe.description.substring(0, 160) + "...";
    }
  });

  const pages = Array.from(
    { length: endPage - startPage + 1 },
    (_, i) => startPage + i
  );

  res.render("search", {
    recipe: recipeData,
    currentPage: page,
    pageCount: pageCount,
    pages: pages,
    maxButtons: maxButtons,
    visiblePages: visiblePages,
    startPage: startPage,
    searchQuery: searchQuery,
    searchIngredients: searchIngredients,
    filteredRatings,
    headerSession,
    selectedCategories: selectedCategories,
    meal: meal,
    cuisine: cuisine,
    dietType: dietType,
    excludeDiet: excludeDiet,
    userEmail,
    user,
  });
});

// recipe detail page

const { ObjectId } = require("mongodb");

app.get("/recipe", async (req, res) => {
  const recipeId = req.query.id;

  const commentData = await commentCollection
    .find({ recipeID: recipeId })
    .project({ commentHeader: 1, username: 1, comment: 1, rating: 1 })
    .toArray();

  const recipeData = await recipesCollection.findOne({
    _id: new ObjectId(recipeId),
  });
  if (!recipeData) {
    res.send("Recipe not found");
    return;
  }

  //recieved all ratings
  var ratings = await commentCollection
    .find({})
    .project({ rating: 1, recipeID: 1 })
    .toArray();

  //Same code as in homepage to display rating avg in recipe page
  var filteredRatings = [];
  for (count = 0; ratings.length > count; count++) {
    //ignores all null or empty ratings
    if (!(ratings[count].rating == null)) {
      //compares filteredRatings array object to object in ratings array
      if (filteredRatings.some((e) => e.recipeID == ratings[count].recipeID)) {
        key = "recipeID";
        value = ratings[count].recipeID;

        //Function to find index based off key and value developed by ChatGPT
        function findIndex(array, key, value) {
          for (let index = 0; index < array.length; index++) {
            const obj = array[index];
            if (obj.hasOwnProperty(key) && obj[key] === value) {
              return index;
            }
          }
        }

        objIndex = findIndex(filteredRatings, key, value);

        //Adds integer of rating together and total amount of ratings for average calculation later on
        filteredRatings[objIndex].rating =
          parseInt(filteredRatings[objIndex].rating) +
          parseInt(ratings[count].rating);
        filteredRatings[objIndex].ratingTotal =
          parseInt(filteredRatings[objIndex].ratingTotal) + parseInt(1);
      } else {
        //If there is no unique recipeID in filtered ratings array, the object is added
        filteredRatings.push({
          recipeID: ratings[count].recipeID,
          rating: parseInt(ratings[count].rating),
          ratingTotal: parseInt(1),
        });
      }
    }
  }

  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  recipeData.name = he.decode(recipeData.name);
  recipeData.steps = he.decode(recipeData.steps);
  if (recipeData.description) {
    recipeData.description = he.decode(recipeData.description);
  }
  recipeData.ingredients_raw_str = he.decode(recipeData.ingredients_raw_str);

  res.render("recipe", {
    recipe: recipeData,
    commentData: commentData,
    filteredRatings: filteredRatings,
    headerSession,
  });
});

//Post comment to database
app.post("/commentPost", async (req, res) => {
  if (!isValidSession(req)) {
    res.redirect("login");
    return;
  } else {
    var email = req.session.email;
    var comment = req.body.comment;
    var recipeID = req.body.idRecipe;
    var header = req.body.commentHeader;
    var rating = req.body.rating;

    const resultUser = await userCollection
      .find({ email: email })
      .project({ username: 1 })
      .toArray();
    var username = resultUser[0].username;

    await commentCollection.insertOne({
      recipeID: recipeID,
      username: username,
      commentHeader: header,
      comment: comment,
      rating: rating,
    });

    res.redirect(`/recipe?id=${recipeID}`);
  }
});

// browse recipe page (redirect from homepage)
app.get("/browseRecipe/:id", async (req, res) => {
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  const userEmail = req.session.email;
  const user = await userCollection.findOne({ email: userEmail });

  const recipesPerPage = 20;
  const page = req.params.id;
  let query = {}; // Initialize an empty query object

  let specificTag = ""; // Specify the default tag value
  let title = "";

  if (page == 1) {
    specificTag = "30-minutes-or-less";
    title = "30-minutes-or-less Recipes";
  } else if (page == 2) {
    specificTag = "low-calorie";
    title = "Low-calories Recipes";
  } else if (page == 3) {
    specificTag = "occasion";
    title = "Recipes of the day";
  } else if (page == 4) {
    specificTag = "breakfast";
    title = "Breakfast Recipes";
  } else if (page == 5) {
    specificTag = "lunch";
    title = "Lunch Recipes";
  } else if (page == 6) {
    specificTag = "dinner";
    title = "Dinner Recipes";
  } else if (page == 7) {
    specificTag = "dessert";
    title = "Dessertt Recipes";
  }

  // Construct the query to filter recipes with the specific tag
  query = { tags: { $regex: specificTag, $options: "i" } };

  const countPromise = recipesCollection.countDocuments(query);
  const recipesPromise = recipesCollection
    .find(query)
    .project({ name: 1, description: 1, servings: 1, _id: 1, ingredients: 1 })
    .limit(recipesPerPage)
    .toArray();

  //recieved all ratings
  var ratings = await commentCollection
    .find({})
    .project({ rating: 1, recipeID: 1 })
    .toArray();

  //Same code as in homepage to display rating avg in recipe page
  var filteredRatings = [];
  for (count = 0; ratings.length > count; count++) {
    //ignores all null or empty ratings
    if (!(ratings[count].rating == null)) {
      //compares filteredRatings array object to object in ratings array
      if (filteredRatings.some((e) => e.recipeID == ratings[count].recipeID)) {
        key = "recipeID";
        value = ratings[count].recipeID;

        //Function to find index based off key and value developed by ChatGPT
        function findIndex(array, key, value) {
          for (let index = 0; index < array.length; index++) {
            const obj = array[index];
            if (obj.hasOwnProperty(key) && obj[key] === value) {
              return index;
            }
          }
        }

        objIndex = findIndex(filteredRatings, key, value);

        //Adds integer of rating together and total amount of ratings for average calculation later on
        filteredRatings[objIndex].rating =
          parseInt(filteredRatings[objIndex].rating) +
          parseInt(ratings[count].rating);
        filteredRatings[objIndex].ratingTotal =
          parseInt(filteredRatings[objIndex].ratingTotal) + parseInt(1);
      } else {
        //If there is no unique recipeID in filtered ratings array, the object is added
        filteredRatings.push({
          recipeID: ratings[count].recipeID,
          rating: parseInt(ratings[count].rating),
          ratingTotal: parseInt(1),
        });
      }
    }
  }

  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  try {
    const [recipeCount, recipeData] = await Promise.all([
      countPromise,
      recipesPromise,
    ]);

    res.render("browseRecipe", {
      recipe: recipeData,
      filteredRatings: filteredRatings,
      headerSession,
      userEmail,
      user,
      title,
    });
  } catch (error) {
    console.log(error);
  }
});

//ingredient image upload page
app.get("/imageUpload", async (req, res) => {
  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  res.render("imageUpload", {
    headerSession,
  });
});

//Users shopping list page
app.get("/shoppingList", async (req, res) => {
  sessionValidation(req, res);
  try {
    const email = req.session.email;
    const user = await userCollection.findOne({ email });

    if (user) {
      const shoppingLists = user.shoppinglists || [];

      res.render("shoppingList", { shoppingLists });
    } else {
      res.render("shoppingList", { shoppingLists: [] });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Create new list and add to database
app.post("/createList", async (req, res) => {
  try {
    const email = req.session.email;
    const listName = req.body.listName;
    const listId = uuidv4();

    // Assuming you have a userCollection variable representing the MongoDB collection
    const result = await userCollection.updateOne(
      { email },
      { $push: { shoppinglists: { id: listId, name: listName, items: [] } } }
    );

    if (result.modifiedCount === 1) {
      console.log("New shopping list created successfully.");
    } else {
      console.log("Failed to create a new shopping list.");
    }

    res.redirect("/shoppingList"); // Redirect to the shopping list page
  } catch (error) {
    // Handle any potential errors
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Add single item to specified shoppinglist
app.post("/addItem", async (req, res) => {
  try {
    const email = req.session.email;
    const listId = req.body.listId;
    const itemName = req.body.itemName;

    // Assuming you have a userCollection variable representing the MongoDB collection
    const result = await userCollection.updateOne(
      { email, "shoppinglists.id": listId },
      { $push: { "shoppinglists.$.items": { name: itemName } } }
    );

    if (result.modifiedCount === 1) {
      console.log("Item added to the shopping list successfully.");
    } else {
      console.log("Failed to add the item to the shopping list.");
    }

    res.redirect("/shoppingList"); // Redirect to the shopping list page
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

//Delete any given list and its contents from user profile
app.post("/deleteList/:listId", async (req, res) => {
  try {
    const email = req.session.email;
    const listId = req.params.listId;

    // Assuming you have a userCollection variable representing the MongoDB collection
    const result = await userCollection.updateOne(
      { email },
      { $pull: { shoppinglists: { id: listId } } }
    );

    if (result.modifiedCount === 1) {
      console.log("Shopping list deleted successfully.");
    } else {
      console.log("Failed to delete the shopping list.");
    }

    res.redirect("/shoppingList"); // Redirect to the shopping list page
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// This will be used by every Clarifai endpoint call
const metadata = new grpc.Metadata();
metadata.set("authorization", "Key " + clarifai_secret);

app.post("/process-image", upload.single("image"), (req, res) => {
  const imageFile = req.file; // get the image file from the request
  console.log(imageFile);
  console.log(imageFile.path);

  const IMAGE_FILE_LOCATION = imageFile.path;
  const imageBytes = fs.readFileSync(IMAGE_FILE_LOCATION);
  stub.PostModelOutputs(
    {
      user_app_id: {
        user_id: "clarifai",
        app_id: "main",
      },
      model_id: "food-item-recognition",
      inputs: [{ data: { image: { base64: imageBytes } } }],
    },
    metadata,
    (err, response) => {
      if (err) {
        console.log("Error3: " + err);
        res.status(500).send("Error processing image");
        return;
      }

      if (response.status.code !== 10000) {
        console.log(
          "Received failed status: " +
            response.status.description +
            "\n" +
            response.status.details
        );
        res.status(500).send("Error processing image");
        return;
      }

      //no errors... continue
      const output = response.outputs[0];
      console.log("Predicted concepts, with confidence values:");
      for (const concept of output.data.concepts) {
        console.log(concept.name + " " + concept.value);
      }
      const concepts = output.data.concepts.map((concept) => ({
        name: concept.name,
        value: concept.value,
      }));

      // Delete the temporary file
      fs.unlink(imageFile.path, (error) => {
        if (error) {
          console.error("Error deleting file:", error);
        }
      });
      // send the results back to the client
      res.json(concepts);
    }
  );
});

//Waiting room while generated recipe is being created
app.get("/waitingroom", async (req, res) => {
  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  const ingredientsAI = req.query.q;

  console.log(ingredientsAI);

  res.render("waitingRoom", { ingredientsAI: ingredientsAI, headerSession });
});

//Display AI generated recipe
app.get("/airecipe", async (req, res) => {
  const ingredientsAI = req.query.q;

  console.log(ingredientsAI);

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt:
      "recipe from only these ingredients: " +
      ingredientsAI +
      '\nas JSON: {"name", "ingredients_raw_str", "steps"}',
    temperature: 0.3,
    max_tokens: 600,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
  });
  const recipe = JSON.parse(response.data.choices[0].text);
  console.log(recipe);

  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  res.render("generatedRecipe", {
    recipe: recipe,
    headerSession,
  });
});

// recipe Upload
app.get("/recipeUpload", async (req, res) => {
  sessionValidation(req, res);
  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  res.render("recipeUpload", { headerSession });
});

//recipe upload to database
app.post("/uploadRecipe", async (req, res) => {
  var name = req.body.name;
  var servings = req.body.servings;
  var ingredientsArray = JSON.parse(req.body.ingredientsArray) || [];
  var instructionsArray = JSON.parse(req.body.instructionsArray) || [];
  var description = req.body.description;

  const ingredients = JSON.stringify(ingredientsArray);
  const steps = JSON.stringify(instructionsArray);

  await recipeUploadCollection.insertOne({
    name: name,
    ingredients: ingredients,
    servings: servings,
    steps: steps,
    description: description,
  });

  res.render("validUploadRecipe");
});

//display community recipes details

app.get("/communityRecipe", async (req, res) => {
  var headerSession = "";
  if (!isValidSession(req)) {
    headerSession = "BeforeLogin";
  }

  const recipeId = req.query.id;

  const recipeData = await recipeUploadCollection.findOne({
    _id: new ObjectId(recipeId),
  });
  if (!recipeData) {
    res.send("Recipe not found");
    return;
  }

  res.render("communityRecipeDetail", {
    recipe: recipeData,
    headerSession,
  });
});

// save or remove recipe from favorites

app.post("/toggleFavoriteRecipe", async (req, res) => {
  const recipeId = req.body.recipeId;
  const userEmail = req.session.email;
  const user = await userCollection.findOne({ email: userEmail });

  if (user) {
    const favoriteRecipes = user.favourite || [];

    const recipeIndex = favoriteRecipes.indexOf(recipeId);
    if (recipeIndex !== -1) {
      // Recipe is already in favorites, remove it
      favoriteRecipes.splice(recipeIndex, 1);
      await userCollection.updateOne(
        { email: userEmail },
        { $set: { favourite: favoriteRecipes } }
      );
      res.send({ status: "removed" });
    } else {
      // Recipe is not in favorites, add it
      favoriteRecipes.push(recipeId);
      await userCollection.updateOne(
        { email: userEmail },
        { $set: { favourite: favoriteRecipes } }
      );
      res.send({ status: "saved" });
    }
  }
});

// Display favorite recipe

app.get("/favourite", async (req, res) => {
  sessionValidation(req, res);
  const userEmail = req.session.email;

  // Receive all ratings
  var ratings = await commentCollection
    .find({})
    .project({ rating: 1, recipeID: 1 })
    .toArray();
  // Same code as in the homepage to display the average rating on the recipe page
  var filteredRatings = [];
  for (count = 0; ratings.length > count; count++) {
    // Ignore all null or empty ratings
    if (!(ratings[count].rating == null)) {
      // Compare filteredRatings array object to object in ratings array
      if (filteredRatings.some((e) => e.recipeID == ratings[count].recipeID)) {
        key = "recipeID";
        value = ratings[count].recipeID;

        // Function to find index based on key and value developed by ChatGPT
        function findIndex(array, key, value) {
          for (let index = 0; index < array.length; index++) {
            const obj = array[index];
            if (obj.hasOwnProperty(key) && obj[key] === value) {
              return index;
            }
          }
        }

        objIndex = findIndex(filteredRatings, key, value);

        // Adds the integer rating together and the total amount of ratings for average calculation later on
        filteredRatings[objIndex].rating =
          parseInt(filteredRatings[objIndex].rating) +
          parseInt(ratings[count].rating);
        filteredRatings[objIndex].ratingTotal =
          parseInt(filteredRatings[objIndex].ratingTotal) + parseInt(1);
      } else {
        // If there is no unique recipeID in the filtered ratings array, the object is added
        filteredRatings.push({
          recipeID: ratings[count].recipeID,
          rating: parseInt(ratings[count].rating),
          ratingTotal: parseInt(1),
        });
      }
    }
  }

  try {
    // Retrieve the user from the userCollection
    const user = await userCollection.findOne({ email: req.session.email });

    if (user) {
      // Retrieve the favorite recipe IDs from the user's favorite field
      const favouriteRecipeIds = user.favourite || [];

      // Fetch the favorite recipes from the recipesCollection
      const favouriteRecipes = await recipesCollection
        .find({
          _id: { $in: favouriteRecipeIds.map((id) => new ObjectId(id)) },
        })
        .toArray();

      var headerSession = "";
      if (!isValidSession(req)) {
        headerSession = "BeforeLogin";
      }

      res.render("favouriteRecipes", {
        recipes: favouriteRecipes,
        headerSession,
        user,
        filteredRatings,
        userEmail,
      }); // Updated variable name and added user object
    } else {
      res.status(404).send({ error: "User not found" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({ error: "An error occurred" });
  }
});

//404 page
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});

//host on localhost port
app.listen(port, () => {
  console.log("Listening on port " + port);
});
