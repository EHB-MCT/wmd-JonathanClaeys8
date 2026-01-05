# API Endpoints

## Authentication
POST /auth/register – Register new user – username, password – returns token, user info
POST /auth/login – Login user – username, password – returns token, user info

## Users
GET /users – Get all users – returns array of user objects
GET /users/:id – Get user by ID – returns user object
POST /users – Create new user – name, email, age – returns success message
PUT /users/:id – Update user – name, email, age – returns success message
DELETE /users/:id – Delete user – returns success message

## Channels (Requires Authentication)
GET /channels – Get user's tracked channels – returns channels array
POST /channels/add – Add channel to track – channelName – returns updated channels
DELETE /channels/:channelName – Remove tracked channel – returns updated channels
GET /channels/messages – Get user's chat messages – returns grouped messages by channel

## Data (Requires Authentication)
GET /data – Get user's chat messages – returns messages array
GET /data/:id – Get message by ID – returns message object
POST /data – Add new chat message – message data – returns success message
PUT /data/:id – Update chat message – message data – returns success message
DELETE /data/:id – Delete message – returns success message

## Analytics
GET /leaderboard – Get user activity ranking – username, totalMessages, avgSentiment, activityRate, riskLevel
GET /scatterplot – Get activity vs sentiment data – username, activityRate, avgSentiment, totalMessages
GET /channel-activity – Get 24-hour channel activity – hourly message counts
GET /sentiment-distribution – Get sentiment breakdown – positive, negative, neutral counts

## Health
GET /get – API health check – returns status message
