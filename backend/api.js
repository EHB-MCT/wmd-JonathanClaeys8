const express = require("express");
const cors = require("cors");
const { connectToMongo } = require('./mongo-connection');
const usersRouter = require('./endpoints/users');
const dataRouter = require('./endpoints/data');

const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/get", (req, res) => {
  res.json({
    message: "API is working with MongoDB",
  });
});

// Use modular endpoints
app.use('/users', usersRouter);
app.use('/data', dataRouter);

// Start server with MongoDB connection
async function startServer() {
  await connectToMongo();
  app.listen(3000, "0.0.0.0", () => {
    console.log("Server running on port 3000");
  });
}

startServer().catch(console.error);