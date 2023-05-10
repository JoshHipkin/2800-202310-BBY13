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
5. run using 'node ./scripts/index.js' OR 'nodemon ./scripts/index.js'.

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

# Conrad_EJSImplementation
(May 9, 2023)
Installed ejs and nodemon to help build website. Also changed all html into ejs files and put in views 
folder to run off scripts/index.js. Made it compatible with header and footer 

- Changed HTML files to EJS files and placed in views folder
- Fixed header and footer compatibility with EJS 
- Added Profile page 
- Implemented working buttons in header and footer to change pages to proper location