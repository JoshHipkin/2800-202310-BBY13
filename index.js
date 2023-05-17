require("dotenv").config();
require("./scripts/utils.js");
const session = require("express-session");
const express = require("express");
const Joi = require("joi");
const saltRounds = 12;
const bcrypt = require("bcrypt");
const MongoStore = require("connect-mongo");
const multer = require('multer');
// configure multer for handling file uploads
const upload = multer({ dest: 'uploads/' });
const fs = require("fs");
const { ClarifaiStub, grpc } = require("clarifai-nodejs-grpc");
const stub = ClarifaiStub.grpc();

const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const clarifai_secret = process.env.CLARIFAI_SECRET

const app = express();
const port = process.env.PORT || 3090;

const expire = 240 * 60 * 60 * 1000;

var { database } = include("dbConnection");

const userCollection = database.db(mongodb_database).collection("users");
const recipesCollection = database.db(mongodb_database).collection("recipes");

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: false }));
app.use("/public/images/", express.static("./public/images"));
app.use("/styles", express.static("./styles"));
app.use(express.static('scripts'));

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
    if (!(isValidSession(req))) {
      res.redirect('/login');
    }
  }

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
        res.render('login-invalid');
        return;
    }

    const result = await userCollection.find({ email: email }).project({ email: 1, password: 1, _id: 1 }).toArray();

    if (result.length != 1) {
        console.log("Email not found");
        res.render('login-invalid');
        return;
    }
    if (await bcrypt.compare(password, result[0].password)) {
        req.session.authenticated = true;
        req.session.email = email;
        req.session.cookie.maxAge = expire;

        res.redirect('home');
        return;
    }
    else {
        res.render('login-invalid');
        return;
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect("/");
});

app.get("/signup", (req, res) => {
    res.render('signup');
});

app.post('/createUser', async (req, res) => {
    var username = req.body.username;
    var email = req.body.email;
    var password = req.body.password;

    if (!req.body.username || req.body.username.trim() === '') {
        res.redirect('/signup');
        return;
    }

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
            username: Joi.string().alphanum().max(20).required(),
            email: Joi.string().max(20).required(),
            password: Joi.string().max(20).required()
        });

    const validationResultName = schema.validate({ username, email, password });
    if (validationResultName.error != null) {
        console.log(validationResultName.error);
        res.redirect('signup');
        return;
    }

    //Hashing Password
    var hashedPassword = await bcrypt.hash(password, 12);

    const allergens = [];
    const diet = [];
    var result = await userCollection.find({email: email}).toArray()

    if (result.length == 0) {
        await userCollection.insertOne({ username: username, email: email, password: hashedPassword, allergens: allergens, diet: diet });
    } else {
        res.render('signupEmailTaken');
        return;
    }

    //authenticating session
    req.session.authenticated = true;
    req.session.email = email;
    req.session.cookie.maxAge = expire;

    res.redirect('security');
});

app.get("/security", async (req, res) => {
    res.render('security');
});

app.post("/securityRecovery", async (req, res) => {
    var securityPassword = req.body.securityPassword;
    var securityQuestion = req.body.securityQuestion;
    console.log(req.body);

    if (!req.body.securityPassword || req.body.securityPassword.trim() === '') {
        res.redirect('/security');
        return;
    }

    const schema = Joi.object(
        {
            securityPassword: Joi.string().max(20).required()
        });

    const validationResultName = schema.validate({ securityPassword });
    if (validationResultName.error != null) {
        console.log(validationResultName.error);
        res.redirect('security');
        return;
    }

    var hashedPassword = await bcrypt.hash(securityPassword, 12);

    await userCollection.updateOne({email: req.session.email}, {$set: {securityPassword: hashedPassword}});
    await userCollection.updateOne({email: req.session.email}, {$set: {securityQuestion: securityQuestion}});

    res.redirect('home');
});

app.get("/forgot", async (req, res) => {
    res.render('forgot');
});

app.post("/forgotLogin", async (req,res) => {
 var email = req.body.email;

 if (!req.body.email || req.body.email.trim() === '') {
    res.redirect('/login');
    return;
}

const schema = Joi.string().required();
const validationResult = schema.validate(email);
if (validationResult.error != null) {
    console.log(validationResult.error);
    res.redirect('login');
    return;
}

const result = await userCollection.find({ email: email }).project({ securityQuestion: 1, securityPassword: 1, _id: 1 }).toArray();

if (result.length != 1) {
    console.log("Email not found");
    res.redirect('/login');
    return;
}

let sQuestion = result[0].securityQuestion;
let sPassword = result[0].securityPassword;
let account = [sQuestion, sPassword];

req.session.email = email;

res.render('verify', {account: account})
});

app.post("/securityPasswordVerify", async (req,res) => {
    var password = req.body.password;

    const schema = Joi.object(
        {
            password: Joi.string().max(20).required()
        });

    const validationResultName = schema.validate({ password });
    if (validationResultName.error != null) {
        console.log(validationResultName.error);
        res.redirect('login');
        return;
    }

    email = req.session.email;
    const result = await userCollection.find({ email: email }).project({ securityPassword: 1, _id: 1 }).toArray();

    if (await bcrypt.compare(password, result[0].securityPassword)) {
        req.session.authenticated = true;
        req.session.email = email;
        req.session.cookie.maxAge = expire;

        res.render('changePassword');
        return;
    } else {
        res.redirect('login')
    }

});

app.post("/securityChangePassword", async (req, res) => {
    var password = req.body.password;

    if (!req.body.password || req.body.password.trim() === '') {
        res.render('changePassword');
        return;
    }

    const schema = Joi.object(
        {
            password: Joi.string().max(20).required()
        });

        const validationResultName = schema.validate({ password });
        if (validationResultName.error != null) {
            console.log(validationResultName.error);
            res.render('changePassword');
            return;
        }

        var hashedPassword = await bcrypt.hash(password, 12);

        await userCollection.updateOne({email: req.session.email}, {$set: {password: hashedPassword}});

        res.redirect('/');
});

app.get("/profile", async (req, res) => {
    sessionValidation(req, res)
    
    const email = req.session.email;
    const result = await userCollection.find({ email: email }).project({ username: 1, password: 1, _id: 1, email: 1 }).toArray();

    res.render('profile', { tabContent: 'profile-info', user: result });
});

app.get("/profile/preferences", async (req, res) => {
    sessionValidation(req, res)

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
        const updateQuery = { $push: { allergens: { $each: filteredAllergies} } };
        if (diet.length > 0) {
            updateQuery.$push.diet = diet;
        } 
        await userCollection.updateOne(
            { email: req.session.email },
            updateQuery
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

app.get("/home", async (req, res) => {
    const user = await userCollection.findOne({ email: req.session.email});
    const allergens = user.allergens;
    const diet = user.diet;    
    const searchQuery = req.query.q;
    const searchTerm = req.query.q;
    const searchIngredients = searchQuery ? searchQuery.split(",") : [];
    const page = parseInt(req.query.page) || 1;
  
    const recipesPerPage = 20;
    const skip = (page - 1) * recipesPerPage;
  
    const query = {};

 
    if (searchTerm && searchTerm.length > 0) {
        const recipeQuery = { name: { $regex: new RegExp(searchTerm, "i") } };
        query.$and = query.$and || [];
        query.$and.push(recipeQuery);
      }


    if (searchIngredients.length > 0) {
        const ingredientQueries = searchIngredients.map(ingredient => (
          { ingredients: { $regex: new RegExp(ingredient, "i") } }
        ));
        query.$and = query.$and || [];
        query.$and.push({ $and: ingredientQueries });
      }
      
      if (allergens && allergens.length > 0) {
        const allergenQuery = allergens.map(allergen => ({ ingredients: { $not: new RegExp(allergen, "i") } }));
        query.$and = query.$and || [];
        query.$and.push({ $or: allergenQuery });
      }
      
      if (diet && diet.length > 0) {
        const dietQuery = diet.map((tag) => ({ search_terms: { $regex: new RegExp(tag, "i") } }));
        query.$and = query.$and || [];
        query.$and.push({ $and: dietQuery });
      }
      
  


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
      searchIngredients: searchIngredients,
      isValidSession, 
      req
    });
  });

  const { ObjectId } = require('mongodb');

  app.get("/recipe", async (req, res) => {
    const recipeId = req.query.id;
  
    const recipeData = await recipesCollection.findOne({ _id: new ObjectId(recipeId) });

  
  
    if (!recipeData) {
      res.send("Recipe not found");
      return;
    }
  
    
  
    res.render("recipe", { recipe: recipeData });
  });

  




app.get("/imageUpload", async (req, res) => {
    res.render('imageUpload');
    
});




    // This will be used by every Clarifai endpoint call
    const metadata = new grpc.Metadata();
    metadata.set("authorization", "Key " + clarifai_secret);

app.post('/process-image', upload.single('image'), (req, res) => {

    console.log("1");
    const imageFile = req.file; // get the image file from the request
    console.log(imageFile);
    console.log(imageFile.path);

    const IMAGE_FILE_LOCATION = imageFile.path;
    const imageBytes = fs.readFileSync(IMAGE_FILE_LOCATION);
    stub.PostModelOutputs(
      {
        user_app_id: {
            "user_id": 'clarifai',
            "app_id": 'main'
        },
        model_id: "food-item-recognition",
        inputs: [
            { data: { image: { base64: imageBytes } } }
        ]
      },
      metadata,
      (err, response) => {
        if (err) {
          console.log("Error3: " + err);
          res.status(500).send('Error processing image');
          return;
        }
  
        if (response.status.code !== 10000) {
          console.log("Received failed status: " + response.status.description + "\n" + response.status.details);
          res.status(500).send('Error processing image');
          return;
        }
        const output = response.outputs[0];
        console.log("Predicted concepts, with confidence values:");
        for (const concept of output.data.concepts) {
            console.log(concept.name + " " + concept.value);
        }
        const concepts = output.data.concepts.map(concept => ({name: concept.name, value: concept.value}));
        res.json(concepts);
      }
    );
  });
      
  app.get("*", (req, res) => {
    res.status(404);
    res.render('404');
}); 

app.listen(port, () => {
    console.log("Listening on port " + port);
});
