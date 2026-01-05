const express = require("express");
const { getDb } = require("../database/mongo-connection");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Conditional authentication middleware
const conditionalAuth = (req, res, next) => {
  const isGlobal = req.query.global === "true";
  if (isGlobal) {
    // Skip authentication for global endpoints - aggregate across ALL users
    next();
  } else {
    // Require authentication for user-specific endpoints
    authenticateToken(req, res, next);
  }
};

// GET /leaderboard - Get Twitch chat users ranked by activity
router.get("/leaderboard", conditionalAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Build aggregation pipeline - global mode aggregates across ALL messages
    const pipeline = [
      {
        $group: {
          _id: "$username",
          totalMessages: { $sum: 1 },
          avgSentimentScore: { $avg: "$sentimentScore" },
          channels: { $addToSet: "$channel" },
          lastMessage: { $max: "$timestamp" },
        },
      },
      {
        $project: {
          _id: 0,
          username: "$_id",
          totalMessages: 1,
          avgSentimentScore: { $round: ["$avgSentimentScore", 2] },
          channelCount: { $size: "$channels" },
          channels: 1,
          lastMessage: 1,
          activityRate: {
            $min: [
              { $multiply: [{ $divide: ["$totalMessages", 100] }, 100] }, // Scale to 0-100
              100,
            ],
          },
        },
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 10 }
    ];

    // For global endpoints, no userId filter - aggregate across ALL users' data
    const userStats = await db
      .collection("chatmessages")
      .aggregate(pipeline)
      .toArray();

    // Add risk level based on sentiment and activity
    const leaderboard = userStats.map((user) => ({
      username: user.username,
      totalMessages: user.totalMessages,
      avgSentiment: user.avgSentimentScore,
      activityRate: Math.min(user.activityRate, 100),
      channelCount: user.channelCount,
      riskLevel:
        user.avgSentimentScore < -0.5
          ? "high"
          : user.avgSentimentScore < -0.2
          ? "medium"
          : "low",
    }));
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /scatterplot - Get data for activity vs sentiment scatterplot from Twitch chat users
router.get("/scatterplot", conditionalAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Build aggregation pipeline - global mode includes all users
    const pipeline = [
      {
        $group: {
          _id: "$username",
          totalMessages: { $sum: 1 },
          avgSentimentScore: { $avg: "$sentimentScore" },
          uniqueChannels: { $addToSet: "$channel" },
        },
      },
      {
        $project: {
          _id: 0,
          username: "$_id",
          activityRate: {
            $min: [
              { $multiply: [{ $divide: ["$totalMessages", 50] }, 100] }, // Scale messages to activity rate
              100,
            ],
          },
          avgSentiment: { $round: ["$avgSentimentScore", 2] },
          totalMessages: 1,
        },
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 50 }, // Limit to top 50 most active users
    ];

    // For global endpoints, no userId filter - aggregate across ALL users' data
    const scatterData = await db
      .collection("chatmessages")
      .aggregate(pipeline)
      .toArray();

    res.json({ success: true, data: scatterData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /channel-activity - Get channel activity data for last 24 hours from Twitch chat
router.get("/channel-activity", conditionalAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Get real messages from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Build query filter - global mode includes all messages
    const query = { timestamp: { $gte: twentyFourHoursAgo } };

    // For global endpoints, no userId filter - aggregate across ALL users' data
    const messages = await db.collection("chatmessages").find(query).toArray();

    // Group messages by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
      hourlyData[hour] = 0;
    }

    messages.forEach((message) => {
      if (message.timestamp) {
        const hour = new Date(message.timestamp).getHours();
        if (hourlyData.hasOwnProperty(hour)) {
          hourlyData[hour]++;
        }
      }
    });

    // Format for chart
    const activityData = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000).getHours();
      activityData.push({
        hour: hour + ":00",
        count: hourlyData[hour] || 0,
      });
    }

    res.json({ success: true, data: activityData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /sentiment-distribution - Get sentiment distribution from Twitch chat messages
router.get("/sentiment-distribution", conditionalAuth, async (req, res) => {
  try {
    const db = getDb();
    
    // Build aggregation pipeline - global mode includes all messages
    const pipeline = [
      {
        $group: {
          _id: "$sentiment",
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          sentiment: "$_id",
          count: 1,
        },
      },
    ];

    // For global endpoints, no userId filter - aggregate across ALL users' data
    const sentimentStats = await db
      .collection("chatmessages")
      .aggregate(pipeline)
      .toArray();

    // Format for chart
    const distribution = {
      positive: 0,
      negative: 0,
      neutral: 0,
    };

    sentimentStats.forEach((stat) => {
      if (distribution.hasOwnProperty(stat.sentiment)) {
        distribution[stat.sentiment] = stat.count;
      }
    });

    res.json({ success: true, data: distribution });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
