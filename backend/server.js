import tmi from "tmi.js";
import Sentiment from "sentiment";

// Twitch Client Configuration
const client = new tmi.Client({
  connection: { reconnect: true },
  channels: ["Shroud"], // Twitch channels
});

// Init
const sentiment = new Sentiment();
const users = {};

// Emotion
function getEmotionLabel(score) {
  if (score > 1) return "positive";
  if (score < -1) return "negative";
  return "neutral";
}

// Connect to Twitch Chat
client.connect();

// On Message Event
client.on("message", (channel, tags, message, self) => {
  if (self) return;

  const username = tags["display-name"];
  const result = sentiment.analyze(message);
  const emotion = getEmotionLabel(result.score);

  // Init user if new
  if (!users[username]) {
    users[username] = {
      count: 0,
      totalScore: 0,
      emotions: { pos: 0, neg: 0, neu: 0 },
    };
  }

  const user = users[username];

  // Update user stats
  user.count++;
  user.totalScore += result.score;

  if (emotion === "positive") user.emotions.pos++;
  else if (emotion === "negative") user.emotions.neg++;
  else user.emotions.neu++;

  // Calculate averages
  const avgScore = (user.totalScore / user.count).toFixed(2);

  // Dominant emotion
  let dominantEmotion = "neu";
  let maxCount = -1;

  for (const [emotion, count] of Object.entries(user.emotions)) {
    if (count > maxCount) {
      maxCount = count;
      dominantEmotion = emotion;
    }
  }

  let emotionLabel;

  if (dominantEmotion === "pos") {
    emotionLabel = "positive";
  } else if (dominantEmotion === "neg") {
    emotionLabel = "negative";
  } else {
    emotionLabel = "neutral";
  }

  // Console log everything

  console.log(
    `[${username}] //// Messages: ${user.count} //// Avg Sentiment: ${avgScore} (${emotionLabel})`
  );
});
