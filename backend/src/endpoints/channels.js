const express = require('express');
const { getDb } = require("../mongo-connection");
const fs = require('fs');
const path = require('path');

const router = express.Router();

// Store active channels in MongoDB for persistence
async function getTrackedChannels() {
  try {
    const db = getDb();
    const result = await db.collection('tracked_channels').findOne({ id: 'active_channels' });
    return result ? result.channels : ['Poofplay'];
  } catch (error) {
    console.error('Error getting tracked channels:', error);
    return ['Poofplay'];
  }
}

async function saveTrackedChannels(channels) {
  try {
    const db = getDb();
    await db.collection('tracked_channels').updateOne(
      { id: 'active_channels' },
      { $set: { channels, updated_at: new Date() } },
      { upsert: true }
    );
    return true;
  } catch (error) {
    console.error('Error saving tracked channels:', error);
    return false;
  }
}

// GET /channels - Get all tracked channels
router.get('/', async (req, res) => {
  try {
    const channels = await getTrackedChannels();
    res.json({ success: true, channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /channels/add - Add a new channel
router.post('/add', async (req, res) => {
  try {
    const { channelName } = req.body;
    
    if (!channelName || channelName.trim() === '') {
      return res.status(400).json({ success: false, error: 'Channel name is required' });
    }
    
    const cleanChannelName = channelName.trim().replace('#', '').toLowerCase();
    
    const channels = await getTrackedChannels();
    if (channels.includes(cleanChannelName)) {
      return res.status(400).json({ success: false, error: 'Channel already being tracked' });
    }
    
    channels.push(cleanChannelName);
    
    if (await saveTrackedChannels(channels)) {
      res.json({ success: true, message: `Added channel: ${cleanChannelName}`, channels });
    } else {
      res.status(500).json({ success: false, error: 'Failed to save channel' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /channels/:channelName - Remove a channel
router.delete('/:channelName', async (req, res) => {
  try {
    const { channelName } = req.params;
    const cleanChannelName = channelName.trim().replace('#', '').toLowerCase();
    
    const channels = await getTrackedChannels();
    const index = channels.indexOf(cleanChannelName);
    
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Channel not found' });
    }
    
    channels.splice(index, 1);
    
    if (await saveTrackedChannels(channels)) {
      res.json({ success: true, message: `Removed channel: ${cleanChannelName}`, channels });
    } else {
      res.status(500).json({ success: false, error: 'Failed to remove channel' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /channels/messages - Get all messages grouped by channel
router.get('/messages', async (req, res) => {
  try {
    const db = getDb();
    const messages = await db.collection('chatmessages')
      .aggregate([
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