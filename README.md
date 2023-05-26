# 2800-202310-BBY13 - ReciPAL

# Hosted App
The app is hosted on Qoddi at the following link:
http://repqxuwlgf.eu09.qoddiapp.com/

# Team Members:
- Jake Robbins
- Conrad Christian
- Josh Hipkin
- Emily Yao

# Project Description:
- BBY 13 is developing a new web app, ‘ReciPal’, that uses AI technology and Kaggle’s Recipe and ingredient dataset to recommend personalized recipes based on users’ available ingredients, food preferences, and dietary restrictions, making meal planning and cooking effortless.

# Technologies used:
- Front End: EJS, CSS, Javascript and Bootstrap.
- Middleware: Multer, fs.
- Backend & Database: NodeJS, Javascript, MongoDB.
- API's: Clarifai API, openAI API.
- Kaggle Dataset: "Food.com Recipes with Search Terms and Tags".
- ChatGPT for coding assistance and bug fixing.

# File Contents:
```
├───public
│   └───images
│       │   background.jpg
│       │   bread.png
│       │   breakfast.jpeg
│       │   burnttoast.webp
│       │   chef.gif
│       │   chefconrad.png
│       │   community.jpeg
│       │   dessert.jpeg
│       │   dinner.jpeg
│       │   dish1.jpg
│       │   dish2.jpg
│       │   dish3.jpg
│       │   favicon.ico
│       │   greencheck.png
│       │   greenscreen.jpg
│       │   kitchen.jpg
│       │   loading-gif.gif
│       │   logo-black.png
│       │   logo-color.png
│       │   logo-no-background.png
│       │   logo-test.png
│       │   logo-white.png
│       │   lunch.jpeg
│       │   recipal-logo.png
│       │   recipehome1.jpeg
│       │   recipehome2.jpeg
│       │   recipehome3.jpeg
│       │   toaster.png
│       │
│       └───__MACOSX
│           │   ._png
│           │
│           └───png
│                   ._logo-black.png
│                   ._logo-color.png
│                   ._logo-no-background.png
│                   ._logo-white.png
│
├───scripts
│       dbConnection.js
│       utils.js
│
├───styles
│       home.css
│       landing-page.css
│       style.css
│
├───UnitTests
│   ├───AuthenticationUserImprovements
│   │       AuthenticationUserImprovementTest.txt
│   │
│   ├───BasicPagesCreated
│   │       PagesUnitTest.txt
│   │
│   ├───BrowseRecipe
│   │       BrowseRecipeUnitTest.txt
│   │
│   ├───EJSImplementation
│   │       EJSImplementationUnitTest.txt
│   │
│   ├───FrontEndIndex
│   │       FrontEndIndexUnitTest.txt
│   │
│   ├───Homepage
│   │       HomepageUnitTest
│   │
│   ├───LoginSecurityRecovery
│   │       SecurityRecoveryTest.txt
│   │
│   ├───Logout
│   │       LogoutUnitTest
│   │
│   ├───Node
│   │       databaseUnitTest
│   │
│   ├───PantryInventory
│   │       PantryInventoryTest.txt
│   │
│   ├───PopulatingProfilePage
│   │       PopulatingProfilePageText.txt
│   │
│   ├───RecipeDetail
│   │       RecipeDetailUnitTest
│   │
│   ├───RecipeFavourite
│   │       ReicpeFavouriteUnitTest.txt
│   │
│   ├───RecipeReviews
│   │       RecipeReviewsTest.txt
│   │
│   ├───SecurityQuestionFix
│   │       SecurityQuestionFix.txt
│   │
│   ├───UploadRecipe
│   │       uploadRecipeUnitTest.txt
│   │
│   ├───UserDatabase
│   │       UserDatabaseTest.txt
│   │
│   └───UserPreferenceTest
│           userPreferences
│
├───uploads (for temporary storage)
│
└───views
    │   404.ejs
    │   browseRecipe.ejs
    │   changePassword.ejs
    │   communityRecipeDetail.ejs
    │   conrad.ejs
    │   favouriteRecipes.ejs
    │   forgot.ejs
    │   forgotInvalid.ejs
    │   generatedRecipe.ejs
    │   homepage.ejs
    │   imageUpload.ejs
    │   index.ejs
    │   login-invalid.ejs
    │   login.ejs
    │   pantry.ejs
    │   preferences.ejs
    │   preferencesSaved.ejs
    │   profile-info.ejs
    │   profile.ejs
    │   recipe.ejs
    │   recipeUpload.ejs
    │   search.ejs
    │   security.ejs
    │   shoppingList.ejs
    │   signup.ejs
    │   signupAllergens.ejs
    │   signupDiet.ejs
    │   signupEmailTaken.ejs
    │   template.ejs
    │   validUploadRecipe.ejs
    │   verify.ejs
    │   verifyInvalid.ejs
    │   waitingRoom.ejs
    │
    └───templates
            footer.ejs
            footerBeforeLogin.ejs
            header.ejs
            headerBeforeLogin.ejs
            ingredientArray.ejs
            recipeCard.ejs
            savedAllergens.ejs
            savedDiet.ejs
```

# How to install and run the app locally:
1. Once the repo Is cloned you will need to signup for mongoDB and optionally install studio3T, set up a database in mongodb and link it with the project. You can do this by adding a file called .env with the following variables:
NODE_SESSION_SECRET=generated guid
MONGODB_PASSWORD=database admin user
MONGODB_HOST=host string from mongodb connection
MONGODB_USER=database admin user
MONGODB_DATABASE=database name
MONGODB_SESSION_SECRET=generated guid
OPENAI_SECRET=api key here
CLARIFAI_SECRET=api key here
*There is plenty of documentation and youtube videos about how to connect to mongo db.
**Alternatively if you have the keys to access our database and api's, simply add them to a .env file at the top level of the repository. You may also skip steps 2, 5, and 6.
2. You will need to import the Kaggle data set "Food.com Recipes with Search Terms and Tags" into the mongo db database. However the dataset is too large for the free version of mongodb. You can download and open the csv file in excel and remove roughly 1/2 or more of the data entries and save the file as a copy. You can then import the csv directly into mongodb using studio3T.
3. Make you have nodeJS installed on your computer as this is a nodeJS run project and you will need to install npm packages to successfully run the app.
4. Either in the command line inside of the repository or in a terminal window in your IDE (visual studio reccommended) type in 'npm i' to install all of the necessary node modules.
5. You will need to sign up for Clarifai API key and instert it into the .env file
6. You will also need to signup for an openAI API key and insert it into the .env file. All configurations are done in the routing of the index.js file.
7. Finally to run the app you can open the terminal in the repository or in you IDE and type node index.js or nodemon index.js

# Features:
- User Sign Up and Login: You can customize your dietary preferences and have a unique username.
- Search Functionality: There are plenty of filters that can be used to discover many different and unique recipes.
- AI Ingredient Photo Recognition: You can upload photos which will be analyzed for ingredients, which you can use to search for recipes
- AI Generated Recipes: you can get custom generated recipes using AI
- Shopping List
- Pantry List
- Recipe Reviews and Favorites
- Community Submitted Recipes
- Filtering for Dietary Preferences or Allergens

# Credits & References:
Credit to ChatGPT for assisting code writing
OpenAI and Clarifi for AI features (Photo Recognition and Generated Recipes)
Auto complete feature from: https://www.educative.io/answers/how-to-add-autocomplete-to-an-input-field-in-javascript
Kaggle recipe Dataset: https://www.kaggle.com/datasets/shuyangli94/foodcom-recipes-with-search-terms-and-tags

# How we used AI for our app:
   We involved chatGPT in our app ideation and brainstorming processes, asking for app ideas, interesting features, and ways to include AI elements in consideration of the project theme. We asked how to best implement our features, what API services and technologies we could use, and routinely had it fix or write code for oour implementation. 

   Our app uses a pre-trained food image classification model provided through the Clarifai API to allow users to select ingredients by taking photos of them.The Clarifai model returns an array of 20 ingredients with their probability values and then our algorithm adds at least 1, but no more than 5, of those ingredients based on a minimum threshold and comparison to prior probability values. This allows for only the most certain ingredients to show and allows the user to include 2 or 3 ingredients in a photo. Any erroneous ingredients can be easily deselected by the user. 

   They can then use those ingredients for searching or custom AI generated recipe creation, which is provided by sending a prompt to the OpenAI API and requesting the response in our recipe JSON format.


# Dev Contact info:
Jake: jrobbins19@my.bcit.ca 
Josh: jhipkin@my.bcit.ca 
Emily: eyao8@my.bcit.ca
Conrad: cchristian5@my.bcit.ca







