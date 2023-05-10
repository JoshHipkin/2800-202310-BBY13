# 2800-202310-BBY13

# Team Members:
- Jake Robbins
- Conrad Christian
- Josh Hipkin
- Emily Yao


# How to Run the App:
1. Only those with the required .env variables can access the mongodb database.
2. clone the repository.
3. Install Node.JS.
4. download all required node packages by typing 'npm i' into the console.
5. run using 'node index.js' OR 'nodemon index.js'.

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