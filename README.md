# 2800-202310-BBY13

# Team Members:
- Jake Robbins
- Conrad Christian
- Josh Hipkin
- Emily Yao
- Emily Yao

# Hosted App
The app is hosted on Qoddi at the following link:
http://repqxuwlgf.eu09.qoddiapp.com/

# How to Run the App:
1. Only those with the required .env variables can access the mongodb database.
2. clone the repository.
3. Install Node.JS.
4. download all required node packages by typing 'npm i' into the console.
5. run using 'node index.js' OR 'nodemon index.js'.

# Conrad_PantryInventory
- Working on ejs pantry page
- Fixed bug on ejs script on preference and profile page
- Build an array based on all the ingredients in mongodb database (2 hrs)
- Troubleshoot and change all string in ingredients to array (2 hrs)
- Iterate and troubleshoot all unique ingredients into array (2 hrs)
- Save array into json file (2hr)
- Implement autosuggest feature on form using array (2 hrs)

# Conrad_RecipeReviews
Conrad_HotFixRatings
(May 18, 2023)
With the new implemented pages of browsing and search. Improved code to work on new pages, created ejs recipe card template, improved interator processes of reviews on ejs cards. Fixed bug where multiple lines of ratings were printing depending on length of comment array 
- Improved ejs code
- Applied ratings to recipes on both browsing and search pages
- Created recipe card template ejs files to refer to 
- Fixed bug with multiple lines of ratings printing

(May 17, 2023)
Implemented the ability to leave reviews on recipes. Comments, comment topic header and ratings are available for the user to rate and review recipes. Changes to homepage displays the avg rating based on user reviews, as well as in profile for each recipe. Used chatGPT to develop function to iterate though an array and return the index of a desired value in object. 

- Hotfixed redirect to text prompts in forgot user id process
- Studied teammates recipe code
- Created comment collection in database
- Created const variable and reference to right location
- Implement backend code to store username, comment and recipeID to comment collection
- Create form with bootstrap to allow user to type comments
- Troubleshoot recipeID not showing up
- Improve and optimize code to pass clean variables into ejs
- Implement code to display other user comments on recipe page
- Fix front end to at least functionality 
- Added comment title to reviews
- Store user rating out of 5
- Display rating with review at the bottom with comments
- Fix a little form front end to display comments a little better
- Decide how to sort array to display average of ratings 
- Troubleshooting changing rating values to return average 
- Researching array methods
- Implement average ratings on recipe cards in homepage
- Added delimiter to parse avg rating 
- Added total number of reviews displayed (based on X reviews)

- Prevent unsigned in user to post reviews

# Conrad_AuthenticationUserImprovements
Conrad_HeaderHotFix
(May 17, 2023)
Changed some code to improve header and footer not working on certain pages. Also optimized code and passed clean variables into ejs.
- Changed code to function on js instead of ejs
- Improved ejs code for header and footer
- Ensured pages recipe, imageUpload and Homepage worked with new header and footer

(May 16, 2023)
Improvements made to creating and logging into a user. Changed redirects on pages. Implemented invalid credential prompts if user 
types in existing email. Changed header and footer depending on user login. Redirect page to login if user tries to access
user session validation pages.

- Added validation if user is logged in or not to restrict pages, ex. Profile
- Changed header and footer for pages before accessing home
- Changed redirect of logo button if user is already at homepage 
- Implemented continue without logging in button on landing page
- Change user id into username in profile
- Fixing session validation functions and valid session functions
- Change header if user is logged in or not when on homepage
- Prevent additional users to be created if email is already in database
- Improve prompts to show user if they used incorrect login details, account already exists, and password restrictions

# Conrad_LoginSecurityRecovery
Conrad_SecurityQuestionFix
(May 12, 2023)
Fixed Problem bug of text running off text field in verify.ejs. Changed to textarea with better wrap properties.
- Changed input field in verify.ejs to textarea and changed some text properties

(May 11, 2023)
Created a feature to allow the user to reset their password if they had forgotten their user ID. 

- Added username to signup page and store to database (15 mins)
- Created page for security.ejs to allow user to type security password with bootstrap (30 mins)
- Researching mongodb methods (15 mins)
- Connecting security password to database (1 hr)
- Troubleshooting select menu for security question (1.5 hr)
- Connecting security question to database (15 mins)
- Creating forgot.ejs and reset.ejs for user to reset password (30 mins)
- Fixing ejs parameter array that reads to reset.ejs(15 mins)
- Fixing proper security question being read to fieldset in reset.ejs (45 mins)
- Writing securityPasswordVerify post to verify password and to properly display (30 mins)
- Created 404 page (10 mins)
- Created ability to change password after verifying user through security question and save to database (30 mins)

# Conrad_PopulatingProfilePage
(May 10, 2023)
Populated profile page that auto fills the profile page with user information drawn from the database. Changed  the 
populate user info script to properly run in index.js. Uses an array to pass the parameter into profile.ejs
in order of id, email, then password. Did not implement an edit button to change user information, just populated
profile page.

- Populated profile page with fieldset of User ID, Email, Password, and Dietery Preferences (30 mins)
- Implemented bootstrap for fieldset (10 mins)
- Created populate user info script to pull correct user information from database (45 mins)
- Changed populate user info script and implemented straight into app.get(profile) instead (10 mins)
- Figured out ejs parameter restrictions and came up with array solution (45 mins)
- Implemented profile user information in array to pass into profile.ejs (15 mins)

# Conrad_UserDatabase
(May 9, 2023)
Implemented a feature to allow users to signup in signup page and have their user info stored into the database. 
Currently if the user does not input a required field or fails joi's validation, the user will be 
redirected back to the signup page. The same works for login, if the user provides incorrect or fails joi's validation
the user will be redirected to the login page.

- Implemented signup page and stores user info in database
- Implemented joi validation
- Implemented login page and allows user to log into account from database

# Conrad_EJSImplementation
(May 9, 2023)
Installed ejs and nodemon to help build website. Also changed all html into ejs files and put in views 
folder to run off scripts/index.js. Made it compatible with header and footer 

- Changed HTML files to EJS files and placed in views folder
- Fixed header and footer compatibility with EJS 
- Added Profile page 
- Implemented working buttons in header and footer to change pages to proper location

# Conrad_MainLoginSignupBasicPages:
(May 9, 2023)
Basic front end crucial pages to get the project started. Implemented bootstrap to give the pages
a little more front end detail. I also created a template.html to copy for other pages. I only created 
the pages with basic content but I didn't connect each page though an index.js as we did in COMP 2537.

- Created index, login and signup html pages
- Created footer and header html in templates folder
- Created navHeaderFooter.js to read and load footer and header templates into pages.
- Implemented Bootstrap and Jquery to get the header and footer to appear
- Created template.html to copy for other pages to keep consistency
