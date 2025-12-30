const tmi = require("tmi.js");
const Sentiment = require("sentiment");
const { connectToMongo, getDb } = require('./mongo-connection');

// Initialize MongoDB connection first
async function startTwitchListener() {
  try {
    await connectToMongo();
    console.log("MongoDB connected for Twitch listener");
    
    // Twitch Client Configuration
    const client = new tmi.Client({
      connection: { reconnect: true },
      identity: {
        username: process.env.TWITCH_USERNAME || 'justinfan12345',
        password: process.env.TWITCH_OAUTH || 'oauth:1234567890abcdef'
      },
      channels: ["Poofplay"], // Twitch channels
    });

    // Init
    const sentiment = new Sentiment();

    // Emotion
    function getEmotionLabel(score) {
      if (score > 1) return "positive";
      if (score < -1) return "negative";
      return "neutral";
    }

    // Connect to Twitch Chat
    client.on('connected', () => {
      console.log('✓ Connected to Twitch chat');
    });
    
    client.on('disconnected', () => {
      console.log('✗ Disconnected from Twitch chat');
    });
    
    client.on('reconnect', () => {
      console.log('🔄 Reconnecting to Twitch chat...');
    });
    
    client.connect();

    // On Message Event
    client.on("message", async (channel, tags, message, self) => {
      if (self) return;

      const username = tags["display-name"];
      const result = sentiment.analyze(message);
      const emotion = getEmotionLabel(result.score);

      try {
        // Save message to MongoDB
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

      // Console log for monitoring
      console.log(
        `[${username}] in ${channel} //// Message: ${message.substring(0, 50)}... //// Sentiment: ${emotion} (${result.score})`
      );
    });

    console.log("✓ Twitch chat listener started for Poofplay channel");
    
  } catch (error) {
    console.error('Failed to start Twitch listener:', error);
    process.exit(1);
  }
}

// Start the listener
startTwitchListener();