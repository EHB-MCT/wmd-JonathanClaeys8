const express = require("express");
const { connectToMongo, getDb } = require('./mongo-connection');

const app = express();
app.use(express.json());

// Basic route
app.get("/get", (req, res) => {
  res.json({
    message: "API is working with MongoDB",
  });
});

// MongoDB example route
app.get("/data", async (req, res) => {
  try {
    const db = getDb();
    const collection = db.collection('example');
    const data = await collection.find({}).toArray();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server with MongoDB connection
async function startServer() {
  await connectToMongo();
  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
  });
}

startServer().catch(console.error);