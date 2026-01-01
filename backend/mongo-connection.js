const { MongoClient } = require("mongodb");

const mongoUri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/wmd_database";
const client = new MongoClient(mongoUri);

let db;

async function connectToMongo() {
  try {
    await client.connect();
    console.log("Connected to MongoDB");
    db = client.db();
    return db;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
}

function getDb() {
  if (!db) {
    throw new Error("Database not initialized. Call connectToMongo() first.");
  }
  return db;
}

module.exports = {
  connectToMongo,
  getDb,
};
