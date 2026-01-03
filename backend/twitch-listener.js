const tmi = require("tmi.js");
const Sentiment = require("sentiment");
const { connectToMongo, getDb } = require('./src/mongo-connection');
const { ObjectId } = require('mongodb');

let currentClient = null;
let currentChannels = [];

// Get all tracked channels from all users
async function getAllTrackedChannels() {
  try {
    const db = getDb();
    const userChannels = await db.collection('user_channels').find({}).toArray();
    
    // Collect all unique channels from all users
    const allChannels = new Set();
    userChannels.forEach(user => {
      user.channels.forEach(channel => allChannels.add(channel));
    });
    
    console.log(`Found ${allChannels.size} unique channels from ${userChannels.length} users`);
    return Array.from(allChannels);
  } catch (error) {
    console.error('Error getting tracked channels:', error);
    return [];
  }
}

// Emotion
function getEmotionLabel(score) {
  if (score > 1) return "positive";
  if (score < -1) return "negative";
  return "neutral";
}

// Start Twitch client with specified channels
async function startTwitchClient(channels) {
  if (currentClient) {
    await currentClient.disconnect().catch(console.error);
  }

  console.log(`📺 Tracking channels: ${channels.join(', ')}`);

  const client = new tmi.Client({
    connection: { reconnect: true },
    identity: {
      username: process.env.TWITCH_USERNAME || 'justinfan12345',
      password: process.env.TWITCH_OAUTH || 'oauth:1234567890abcdef'
    },
    channels: channels,
  });

  const sentiment = new Sentiment();

  client.on('connected', () => {
    console.log('✓ Connected to Twitch chat');
    console.log('📊 Connection details:', {
      username: client.getUsername(),
      channels: client.getChannels(),
      isConnected: client.readyState() === 'OPEN'
    });
  });
  
  client.on('disconnected', () => {
    console.log('✗ Disconnected from Twitch chat');
  });
  
  client.on('reconnect', () => {
    console.log('🔄 Reconnecting to Twitch chat...');
  });

  client.on("message", async (channel, tags, message, self) => {
    if (self) return;

    const username = tags["display-name"];
    const result = sentiment.analyze(message);
    const emotion = getEmotionLabel(result.score);

    try {
      const db = getDb();
      
      // Find which users are tracking this channel
      const trackingUsers = await db.collection('user_channels').find({
        channels: channel.replace('#', '').toLowerCase()
      }).toArray();
      
      if (trackingUsers.length === 0) {
        console.log(`No users tracking channel ${channel}, skipping message`);
        return;
      }
      
      // Create message data without userId for now (will be associated when users query)
      const messageData = {
        username: username,
        message: message,
        channel: channel.replace('#', '').toLowerCase(),
        sentiment: emotion,
        sentimentScore: result.score,
        timestamp: new Date(),
        twitchUserId: tags['user-id'], // Twitch user ID, not our app user ID
        badges: tags.badges || {},
        color: tags.color || '#ffffff'
      };

      // Save one copy of the message for each tracking user
      console.log(`DEBUG: Processing message from ${username} in ${channel}`);
      console.log(`DEBUG: Found ${trackingUsers.length} tracking users:`, trackingUsers.map(u => u.userId));
      
      for (const user of trackingUsers) {
        // Convert userId to ObjectId for proper database query
        const userIdObjectId = typeof user.userId === 'string' ? new ObjectId(user.userId) : user.userId;
        
        // Get user information
        const userInfo = await db.collection('users').findOne({ _id: userIdObjectId });
        
        if (!userInfo) {
          console.log(`⚠️ User ${user.userId} not found in users collection, skipping message`);
          continue;
        }
        
        try {
          await db.collection('chatmessages').insertOne({
            ...messageData,
            userId: user.userId // Keep original userId format for consistency
          });
          console.log(`✓ Saved message from ${username} in ${channel} for user ${user.userId}`);
        } catch (insertError) {
          console.error(`Failed to save message for user ${user.userId}:`, insertError);
        }
      }
      
      console.log(`✓ Saved message from ${username} in ${channel} for ${trackingUsers.length} user(s)`);
    } catch (error) {
      console.error('Error saving message to MongoDB:', error);
    }

    console.log(
      `[${username}] in ${channel} //// Message: ${message.substring(0, 50)}... //// Sentiment: ${emotion} (${result.score})`
    );
  });

  await client.connect();
  currentClient = client;
  return client;
}

// Check for channel changes and reconnect if needed
async function checkAndReconnectIfNecessary() {
  try {
    const channels = await getAllTrackedChannels();
    
    if (JSON.stringify(channels.sort()) !== JSON.stringify(currentChannels.sort())) {
      console.log('🔄 Channel list changed, reconnecting...');
      currentChannels = [...channels];
      await startTwitchClient(channels);
    }
  } catch (error) {
    console.error('Error checking channel changes:', error);
  }
}

// Main initialization function
async function startTwitchListener() {
  try {
    await connectToMongo();
    console.log("MongoDB connected for Twitch listener");
    
    // Get initial channels from all users
    currentChannels = await getAllTrackedChannels();
    
    // Start client
    await startTwitchClient(currentChannels);
    
    // Check for channel changes every 30 seconds
    setInterval(checkAndReconnectIfNecessary, 30000);
    
    console.log(`✓ Twitch chat listener started for ${currentChannels.length} channel(s)`);
    console.log(`🔄 Checking for channel changes every 30 seconds`);
    
  } catch (error) {
    console.error('Failed to start Twitch listener:', error);
    process.exit(1);
  }
}

// Start the listener
startTwitchListener();

// Export for testing
module.exports = { startTwitchClient, checkAndReconnectIfNecessary };