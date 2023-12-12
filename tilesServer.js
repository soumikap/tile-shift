
const http = require('http');
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const portNumber = 5005;
const app = express();

/* MongoDB stuff */
require("dotenv").config({ path: path.resolve(__dirname, '.env') })  
const uri = process.env.MONGO_CONNECTION_STRING;
const databaseAndCollection = {db: "TileGame", collection:"highscores"};
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

var currSession = {username: "", diff: "easy", size: 3, lastscore: 0, hs: 0};

app.post("/", async function (request, res) { 
    const username = request.body.username;
    const gridsize = request.body.gridsize;
    const difficulty = request.body.level;
    
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
                .findOne({username: username});
        if (findIt) {
       		// it exists
			// do nothing probably
            console.log("user already exists");
   		} else { 
       		// it doesn't exist, make new json and insert
            let newuser = {username: username, lastscore: 0, highscores: {easy: [0,0,0], normal: [0,0,0], hard: [0,0,0]}}
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
    // let variables = {username: currSession.username, gridsize: currSession.size, difficulty: currSession.diff};
    res.render("tile-game");
});

app.post("/tilegame", async function(req, res) {
    //take score and update lastscore in mongo
    const moves = req.body.moves;
    // console.log("moves: "+moves);
    currSession.score = moves;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        // see if score is higher than highscore
        const findIt = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .findOne({username: currSession.username});
        const hs = findIt.highscores.easy[0];
        currSession.hs = hs;

        // moves is less than highscore, update highscore
        if (hs === 0 || Number(hs) > moves) {
            const filter = {username: currSession.username};
            const update = {$set: {"highscores.easy.0": moves, lastscore: moves}};
            const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(filter, update);
        } else { // else just update lastscore
            const filter = {username: currSession.username};
            const update = {$set: {lastscore: moves}};
            const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(filter, update);
        }
        

    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }


    res.redirect("highscore");
});

app.get("/highscore", async function (req, res) {
    //retrieve user's lastscore from mongo and display along with highscore
    let variables = {yourscore: currSession.score, highscore: currSession.hs};
    res.render("high-score", variables);
});