# Getting Started Guide

This guide will walk you through setting up and running the Twitch Chat Monitoring System.

## System Requirements

### Required Software

- **Docker** (version 20.0 or higher)
- **Docker Compose** (version 1.29 or higher)
- **Git** (for cloning the repository)
- **Modern web browser** (Chrome, Firefox, Safari, or Edge)
- **Node.js**

## Installation Steps

### Step 1: Clone the Repository

1. Open your terminal or command prompt
2. Navigate to where you want to store the project
3. Clone the repository:

### Step 2: Build and Start the Application

1. **Build all services:**

   ```bash
   docker-compose build
   ```

2. **Start the application:**

   ```bash
   docker-compose up -d
   ```

3. **Check service status:**
   ```bash
   docker-compose ps
   ```

You should see three running services:

- `mongo` (database)
- `backend` (API server)
- `frontend` (web interface)

## Accessing the Application

### Web Interface

1. **Run the live server**
2. **Ib your browser** http://127.0.0.1:5500/frontend/public/index.html
3. **Register an account**:

   - Click "Register"
   - Fill in username and password (min 6 characters)
   - Click "Sign Up"

4. **Login** with your new credentials
5. **Track twitch channel** Add a channel to track and wait max 30 seconds
