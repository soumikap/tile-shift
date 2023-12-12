const http = require('http');
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const portNumber = 5005;
const app = express();
const axios = require('axios');

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

var currSession = {username: "", diff: "easy", size: 3, lastscore: 0, hs: 0, newhs: false};

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
    let variables = {size: currSession.size, level: currSession.diff};
    res.render("tile-game",variables);
});

app.post("/tilegame", async function(req, res) {
    //take score and update lastscore in mongo
    const moves = req.body.moves;
    // console.log("moves: "+moves);
    currSession.score = moves;

    const client = new MongoClient(uri);
    try {
        await client.connect();
        // first update last score
        const filter = {username: currSession.username};
        const updatelastscore = {$set: {lastscore: moves}};
        const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(filter, updatelastscore);

        // now figure out hs and if that should be updated
        const findIt = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .findOne({username: currSession.username});
        let hs;
        let update;
        if (currSession.diff === "easy") {
            if (currSession.size === "3x3") {
                hs = findIt.highscores.easy[0];
                update = {$set: {"highscores.easy.0": moves}};
            } else if (currSession.size === "4x4") {
                hs = findIt.highscores.easy[1];
                update = {$set: {"highscores.easy.1": moves}};
            } else if (currSession.size === "5x5") {
                hs = findIt.highscores.easy[2];
                update = {$set: {"highscores.easy.2": moves}};
            }
        } else if (currSession.diff === "normal") {
            if (currSession.size === "3x3") {
                hs = findIt.highscores.normal[0];
                update = {$set: {"highscores.normal.0": moves}};
            } else if (currSession.size === "4x4") {
                hs = findIt.highscores.normal[1];
                update = {$set: {"highscores.normal.1": moves}};
            } else if (currSession.size === "5x5") {
                hs = findIt.highscores.normal[2];
                update = {$set: {"highscores.normal.2": moves}};
            }
        } else if (currSession.diff === "hard") {
            if (currSession.size === "3x3") {
                hs = findIt.highscores.hard[0];
                update = {$set: {"highscores.hard.0": moves}};
            } else if (currSession.size === "4x4") {
                hs = findIt.highscores.hard[1];
                update = {$set: {"highscores.hard.1": moves}};
            } else if (currSession.size === "5x5") {
                hs = findIt.highscores.hard[2];
                update = {$set: {"highscores.hard.2": moves}};
            }
        }
        
        // moves is less than highscore, update highscore
        if (hs === 0 || Number(hs) > moves) {
            currSession.hs = moves;
            currSession.newhs = true;
            const filter = {username: currSession.username};
            //const update = {$set: {"highscores.easy.0": moves, lastscore: moves}};
            const result = await client.db(databaseAndCollection.db)
                .collection(databaseAndCollection.collection)
                .updateOne(filter, update);
        } else { // else just update lastscore
            currSession.hs = hs;
            currSession.newhs = false;
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
    const apiURL = `http://numbersapi.com/${currSession.score}`;
    axios.get(apiURL).then(response => {
        let variables;

        if (currSession.newhs) {
            variables = {yourscore: currSession.score, highscore: currSession.hs, funfact: response.data.toLowerCase(), highscoremsg: "new high score!"};
        } else {
            variables = {yourscore: currSession.score, highscore: currSession.hs, funfact: response.data.toLowerCase(), highscoremsg: ""};
        }
        res.render("high-score", variables);
    }).catch(error => {
        console.error('Error getting funfact: ',error)
    });
});