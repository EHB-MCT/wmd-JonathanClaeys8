const express = require("express");
const { ObjectId } = require("mongodb");
const { getDb } = require("../mongo-connection");

const router = express.Router();

// GET /users - Get all users
router.get("/", async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection("users").find({}).toArray();
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /users/:id - Get user by ID
router.get("/:id", async (req, res) => {
  try {
    const db = getDb();
    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(req.params.id) });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /users - Create new user
router.post("/", async (req, res) => {
  try {
    const db = getDb();
    const { name, email, age } = req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ success: false, error: "Name and email are required" });
    }

    const newUser = { name, email, age, createdAt: new Date() };
    const result = await db.collection("users").insertOne(newUser);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      id: result.insertedId,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /users/:id - Update user
router.put("/:id", async (req, res) => {
  try {
    const db = getDb();
    const { name, email, age } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (age) updateData.age = age;
    updateData.updatedAt = new Date();

    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData });

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /users/:id - Delete user
router.delete("/:id", async (req, res) => {
  try {
    const db = getDb();
    const result = await db
      .collection("users")
      .deleteOne({ _id: new ObjectId(req.params.id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: "User not found" });
    }

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /users/leaderboard - Get users ranked by activity
router.get('/leaderboard', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection("users").find({}).toArray();
    
    // Sort by activityRate (descending) and limit to top users
    const leaderboard = users
      .map(user => ({
        username: user.username || user.name || 'Unknown',
        activityRate: user.activityRate || Math.floor(Math.random() * 100),
        riskLevel: user.riskLevel || 'low'
      }))
      .sort((a, b) => b.activityRate - a.activityRate)
      .slice(0, 10);
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /scatterplot - Get data for activity vs sentiment scatterplot
router.get('/scatterplot', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection("users").find({}).toArray();
    
    const scatterData = users.map(user => ({
      username: user.username || user.name || 'Unknown',
      activityRate: user.activityRate || Math.floor(Math.random() * 100),
      avgSentiment: user.avgSentiment || (Math.random() * 2 - 1)
    }));
    
    res.json({ success: true, data: scatterData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
