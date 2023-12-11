
const http = require('http');
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const portNumber = 5005;
const app = express();

/* MongoDB stuff */
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "CMSC335_DB", collection:"campApplicants"};
const { MongoClient, ServerApiVersion } = require('mongodb');

app.use(bodyParser.urlencoded({extended:false}));

app.set("views", path.resolve(__dirname, "templates"));
app.set("view engine", "ejs");
app.use('/images', express.static(__dirname + '/images'));
app.use(express.static(__dirname + '/templates'));

console.log(`Web server is running at http://localhost:${portNumber}`);
process.stdin.setEncoding("utf8");

app.listen(portNumber);

app.get("/", (req, res) => {
    res.render("index");
});

var currSession = {username: "", diff: "easy", size: 3};

app.post("/", async function (req, res) {
    const username = request.body.username;
    const gridsize = request.body.username;
    const difficulty = request.body.difficulty;
    
    currSession.username = username;
    currSession.size = gridsize;
    currSession.diff = difficulty;

    // work with database here
    const client = new MongoClient(uri);
    try {
        await client.connect();
        // seeing if username already exists
        const findIt = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .findOne(filter);
        if (result) {
       		// it exists
			// do nothing probably
   		} else {
       		// it doesn't exist, make new json and insert
            let newuser = {username: username, highscores: {easy: [0,0,0], normal: [0,0,0], hard: [0,0,0]}}
            const result = await client.db(databaseAndCollection.db).collection(databaseAndCollection.collection).insertOne(newuser);
   		}
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }

    res.redirect("tilegame");
});

app.get("/tilegame", (req, res) => {
    // so I'll need to get the requested grid size
    // then I'll want to generate a randomized grid of that size
    // do we want the completed picture somewhere?
    // put that randomized grid inside of the variable and load it back up to the render
    // should there a BIG div, for the entire grid, and I generate all the small pics as their own elements?
    // the blank pic could have its own ID, and I can document.querySelect just that ID?
    // document.getElementsByClassName, every piece is class tile
    // then when a tile is clicked, I check if adjacent is a blank tile, if yes move tile
    // have each grid have its own set "randomized grid"
    //generateGrid();
    //starGame();
    res.render("This is the tilegame page");
});




/*
function generateGrid() {
    // read reqgrid from the database?
}
*/