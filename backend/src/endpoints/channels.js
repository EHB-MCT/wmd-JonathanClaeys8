const express = require('express');
const { getDb } = require("../mongo-connection");
const { authenticateToken } = require("../middleware/auth");
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Store active channels in MongoDB for persistence - now per user
async function getTrackedChannels(userId) {
  try {
    const db = getDb();
    const result = await db.collection('user_channels').findOne({ userId });
    return result ? result.channels : [];
  } catch (error) {
    console.error('Error getting tracked channels:', error);
    return [];
  }
}

async function saveTrackedChannels(userId, channels) {
  try {
    const db = getDb();
    await db.collection('user_channels').updateOne(
      { userId },
      { $set: { channels, updated_at: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving tracked channels:', error);
    return false;
  }
}

// GET /channels - Get all tracked channels for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const channels = await getTrackedChannels(userId);
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /channels/add - Add a new channel for authenticated user
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { channelName } = req.body;
    
    if (!channelName || channelName.trim() === '') {
      return res.status(400).json({ success: false, error: 'Channel name is required' });
    }
    
    const cleanChannelName = channelName.trim().replace('#', '').toLowerCase();
    
    const channels = await getTrackedChannels(userId);
    if (channels.includes(cleanChannelName)) {
      return res.status(400).json({ success: false, error: 'Channel already being tracked' });
    }
    
    channels.push(cleanChannelName);
    
    if (await saveTrackedChannels(userId, channels)) {
      // Trigger Twitch listener update
      try {
        // This will be picked up by the listener's periodic check
        console.log(`Channel ${cleanChannelName} added by user ${userId}, listener will update in 30s or less`);
      } catch (err) {
        console.error('Error triggering listener update:', err);
      }
      
      res.json({ success: true, message: `Added channel: ${cleanChannelName}`, channels });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save channel' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /channels/:channelName - Remove a channel for authenticated user
router.delete('/:channelName', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { channelName } = req.params;
    const cleanChannelName = channelName.trim().replace('#', '').toLowerCase();
    
    const channels = await getTrackedChannels(userId);
    const index = channels.indexOf(cleanChannelName);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    channels.splice(index, 1);
    
    if (await saveTrackedChannels(userId, channels)) {
      res.json({ success: true, message: `Removed channel: ${cleanChannelName}`, channels });
    } else {
      res.status(500).json({ success: false, error: 'Failed to remove channel' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /channels/messages - Get all messages for authenticated user
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const db = getDb();
    const messages = await db.collection('chatmessages')
      .aggregate([
        { $match: { userId: userId } },
        { $sort: { timestamp: -1 } },
        { $limit: 200 },
        {
          $group: {
            _id: '$channel',
            messages: {
              $push: {
                username: '$username',
                message: '$message',
                sentiment: '$sentiment',
                sentimentScore: '$sentimentScore',
                timestamp: '$timestamp',
                userId: '$userId',
                badges: '$badges',
                color: '$color'
              }
            },
            count: { $sum: 1 },
            lastMessage: { $max: '$timestamp' }
          }
        },
        { $sort: { lastMessage: -1 } }
      ])
      .toArray();
    
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;