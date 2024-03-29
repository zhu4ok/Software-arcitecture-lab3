const express = require("express");
const MongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const mongoose = require('mongoose');

const app = express();
const jsonParser = express.json();

// Connect to MongoDB using Mongoose
mongoose.connect('mongodb://localhost:27017/userdb')
  .then(() => console.log('MongoDB connected via Mongoose...'))
  .catch(err => console.error(err));

let dbClient;

app.use(express.static(__dirname + "/public"));

// If you still need to use MongoClient for specific operations not covered by Mongoose
const mongoClient = new MongoClient("mongodb://localhost:27017/userdb");
mongoClient.connect(function (err, client) {
    if (err) return console.log(err);
    dbClient = client;
    app.locals.collection = client.db("userdb").collection("users");
    // Now you can listen for connections to your express app
    app.listen(3000, function () {
        console.log("Server listening on port 3000...");
    });
});

// API routes
app.get("/api/users", function (req, res) {
    const collection = req.app.locals.collection;
    collection.find({}).toArray(function (err, users) {
        if (err) return console.log(err);
        res.send(users);
    });
});
app.get("/api/users/:id", function (req, res) {

    const id = new objectId(req.params.id);
    const collection = req.app.locals.collection;
    collection.findOne({ _id: id }, function (err, user) {

        if (err) return console.log(err);
        res.send(user);
    });
});

app.post("/api/users", jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);

    // Додавання поля Surname
    const userName = req.body.name;
    const userSurname = req.body.surname; // Отримання Surname з тіла запиту
    const userAge = req.body.age;
    const user = { name: userName, surname: userSurname, age: userAge };

    const collection = req.app.locals.collection;
    collection.insertOne(user, function (err, result) {
        if (err) return console.log(err);
        res.send(user);
    });
});


app.delete("/api/users/:id", function (req, res) {

    const id = new objectId(req.params.id);
    const collection = req.app.locals.collection;
    collection.findOneAndDelete({ _id: id }, function (err, result) {

        if (err) return console.log(err);
        let user = result.value;
        res.send(user);
    });
});

app.put("/api/users/:id", jsonParser, function (req, res) {
    if (!req.body) return res.sendStatus(400);

    const id = new objectId(req.params.id);
    const userName = req.body.name;
    const userSurname = req.body.surname; // Оновлення для Surname
    const userAge = req.body.age;

    const collection = req.app.locals.collection;
    collection.findOneAndUpdate({ _id: id }, { $set: { name: userName, surname: userSurname, age: userAge }},
        { returnDocument: 'after' }, function (err, result) {
            if (err) return console.log(err);
            const user = result.value;
            res.send(user);
        });
});


process.on("SIGINT", () => {
    dbClient.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
});