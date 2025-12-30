# Documentation

## Eindpoints

GET /users – Retrieves a list of all tracked users – id, username, messagesSent, avgSentiment, activityRate, avgTimeGap, riskLevel

GET /users/:id – Retrieves a detailed profile of a specific user – id, username, messagesSent, avgSentiment, activityRate, avgTimeGap, riskLevel, messages (timestamp, content, sentiment)

GET /leaderboard – Retrieves a ranking of users based on activity, sentiment, or risk – username, activityRate, riskLevel

GET /scatterplot – Returns data for a scatterplot of activity vs sentiment – username, activityRate, avgSentiment

GET /users/:id/messages – Retrieves a user’s message history – timestamp, content, sentiment

POST /messages – Adds a new message for analysis – userId, content – returns messageId, sentiment, success

GET /users/:id/risk – Retrieves the risk/attention score for a user – userId, riskLevel, reasoning
