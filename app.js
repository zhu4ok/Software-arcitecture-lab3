const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");

const app = express();
app.use(express.json()); // Using express built-in body parser
app.use(express.static(__dirname + "/public"));

const mongoUri = "mongodb://localhost:27017";
const dbName = "userdb";

const client = new MongoClient(mongoUri);

let db;
let usersCollection;

// Connect to MongoDB
client.connect(function (err, connectedClient) {
    if (err) {
        console.log("Error connecting to MongoDB", err);
        return;
    }
    db = connectedClient.db(dbName);
    usersCollection = db.collection("users");

    app.listen(3000, () => {
        console.log("Server listening on port 3000...");
    });
});

// API routes
app.get("/api/users", async (req, res) => {
    try {
        const users = await usersCollection.find({}).toArray();
        res.send(users);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving users from the database.");
    }
});

app.get("/api/users/:id", async (req, res) => {
    try {
        const user = await usersCollection.findOne({ _id: new ObjectId(req.params.id) });
        if (!user) {
            return res.status(404).send("User not found.");
        }
        res.send(user);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving user.");
    }
});

app.post("/api/users", async (req, res) => {
    try {
        const { name, surname, age } = req.body;
        const result = await usersCollection.insertOne({ name, surname, age });
        res.status(201).send(result.ops[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding new user.");
    }
});

app.delete("/api/users/:id", async (req, res) => {
    try {
        const result = await usersCollection.findOneAndDelete({ _id: new ObjectId(req.params.id) });
        if (!result.value) {
            return res.status(404).send("User not found.");
        }
        res.send(result.value);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting user.");
    }
});

app.put("/api/users/:id", async (req, res) => {
    try {
        const { name, surname, age } = req.body;
        const result = await usersCollection.findOneAndUpdate(
            { _id: new ObjectId(req.params.id) },
            { $set: { name, surname, age }},
            { returnOriginal: false }
        );
        if (!result.value) {
            return res.status(404).send("User not found.");
        }
        res.send(result.value);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating user.");
    }
});

process.on("SIGINT", () => {
    client.close();
    console.log("MongoDB connection closed due to app termination");
    process.exit(0);
});
