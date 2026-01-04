# Simple MongoDB Node.js Setup

## Quick Start
```bash
docker compose up --build
```

## What this setup provides:
- **MongoDB**: No authentication, simple connection
- **Node.js API**: Express server with MongoDB integration
- **Persistent Data**: Data survives container restarts

## Container Communication
- MongoDB service name: `mongo`
- Backend connects to: `mongodb://mongo:27017/wmd_database`

## API Endpoints
- `GET /get` - Health check
- `GET /data` - Example MongoDB data endpoint

## Files Structure
- `docker-compose.yml` - Services configuration
- `.env` - Simple environment variables
- `backend/api.js` - Express server
- `backend/mongo-connection.js` - MongoDB connection helper

Perfect for school projects!