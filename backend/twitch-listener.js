const tmi = require("tmi.js");
const Sentiment = require("sentiment");
const { connectToMongo, getDb } = require('./src/mongo-connection');

let currentClient = null;
let currentChannels = [];

// Get channels from database
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
      const messageData = {
        username: username,
        message: message,
        channel: channel,
        sentiment: emotion,
        sentimentScore: result.score,
        timestamp: new Date(),
        userId: tags['user-id'],
        badges: tags.badges || {},
        color: tags.color || '#ffffff'
      };

      await db.collection('chatmessages').insertOne(messageData);
      console.log(`✓ Saved message from ${username} in ${channel}`);
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
    const channels = await getTrackedChannels();
    
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
    
    // Get initial channels
    currentChannels = await getTrackedChannels();
    
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