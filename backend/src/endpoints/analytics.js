const express = require('express');
const { getDb } = require("../mongo-connection");

const router = express.Router();

// GET /leaderboard - Get Twitch chat users ranked by activity
router.get('/leaderboard', async (req, res) => {
  try {
    const db = getDb();
    
    // Aggregate chat messages to get real Twitch user activity
    const userStats = await db.collection('chatmessages').aggregate([
      {
        $group: {
          _id: '$username',
          totalMessages: { $sum: 1 },
          avgSentimentScore: { $avg: '$sentimentScore' },
          channels: { $addToSet: '$channel' },
          lastMessage: { $max: '$timestamp' }
        }
      },
      {
        $project: {
          _id: 0,
          username: '$_id',
          totalMessages: 1,
          avgSentimentScore: { $round: ['$avgSentimentScore', 2] },
          channelCount: { $size: '$channels' },
          channels: 1,
          lastMessage: 1,
          activityRate: {
            $min: [
              { $multiply: [{ $divide: ['$totalMessages', 100] }, 100] }, // Scale to 0-100
              100
            ]
          }
        }
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 10 }
    ]).toArray();

    // Add risk level based on sentiment and activity
    const leaderboard = userStats.map(user => ({
      username: user.username,
      totalMessages: user.totalMessages,
      avgSentiment: user.avgSentimentScore,
      activityRate: Math.min(user.activityRate, 100),
      channelCount: user.channelCount,
      riskLevel: user.avgSentimentScore < -0.5 ? 'high' : 
                 user.avgSentimentScore < -0.2 ? 'medium' : 'low'
    }));
    
    res.json({ success: true, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /scatterplot - Get data for activity vs sentiment scatterplot from Twitch chat users
router.get('/scatterplot', async (req, res) => {
  try {
    const db = getDb();
    
    // Aggregate chat messages for scatter plot data
    const scatterData = await db.collection('chatmessages').aggregate([
      {
        $group: {
          _id: '$username',
          totalMessages: { $sum: 1 },
          avgSentimentScore: { $avg: '$sentimentScore' },
          uniqueChannels: { $addToSet: '$channel' }
        }
      },
      {
        $project: {
          _id: 0,
          username: '$_id',
          activityRate: {
            $min: [
              { $multiply: [{ $divide: ['$totalMessages', 50] }, 100] }, // Scale messages to activity rate
              100
            ]
          },
          avgSentiment: { $round: ['$avgSentimentScore', 2] },
          totalMessages: 1
        }
      },
      { $sort: { totalMessages: -1 } },
      { $limit: 50 } // Limit to top 50 most active users
    ]).toArray();
    
    res.json({ success: true, data: scatterData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /channel-activity - Get channel activity data for last 24 hours from Twitch chat
router.get('/channel-activity', async (req, res) => {
  try {
    const db = getDb();
    
    // Get real messages from the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const messages = await db.collection('chatmessages')
      .find({ timestamp: { $gte: twentyFourHoursAgo } })
      .toArray();

    // Group messages by hour
    const hourlyData = {};
    for (let i = 0; i < 24; i++) {
      const hour = new Date(Date.now() - i * 60 * 60 * 1000).getHours();
      hourlyData[hour] = 0;
    }

    messages.forEach(message => {
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
        hour: hour + ':00',
        count: hourlyData[hour] || 0
      });
    }

    res.json({ success: true, data: activityData });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /sentiment-distribution - Get sentiment distribution from Twitch chat messages
router.get('/sentiment-distribution', async (req, res) => {
  try {
    const db = getDb();
    
    // Aggregate sentiment from all chat messages
    const sentimentStats = await db.collection('chatmessages').aggregate([
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          sentiment: '$_id',
          count: 1
        }
      }
    ]).toArray();

    // Format for chart
    const distribution = {
      positive: 0,
      negative: 0,
      neutral: 0
    };

    sentimentStats.forEach(stat => {
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