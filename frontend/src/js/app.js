// Configuration
const API_BASE_URL = "http://localhost:3000/data";
const CHANNELS_API_URL = "http://localhost:3000/channels";

// DOM Elements
let channelsList,
  messagesContainer,
  channelInput,
  addButton,
  feedback,
  suspiciousUsersContainer;

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function () {
  // Set active navigation link
  setActiveNavLink();

  // Check moderator access first
  const user = checkModeratorAccess();
  if (!user) return; // Will redirect if not authorized

  // Display user info in navbar
  displayUserInfo();

  initializeElements();
  setupEventListeners();
  init();
});

function initializeElements() {
  channelsList = document.getElementById("channels-list");
  messagesContainer = document.getElementById("messages-container");
  channelInput = document.getElementById("channel-input");
  addButton = document.getElementById("add-button");
  feedback = document.getElementById("add-channel-feedback");
  suspiciousUsersContainer = document.getElementById("suspicious-users");
}

function setupEventListeners() {
  // Handle Enter key in channel input
  if (channelInput) {
    channelInput.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        addChannel();
      }
    });
  }
}

// Main initialization function
function init() {
  fetchChannels();
  fetchMessages();
  setInterval(() => {
    fetchMessages();
    fetchChannels();
  }, 5000);
}

// Fetch and display channels
async function fetchChannels() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return [];
    }

    const response = await fetch(CHANNELS_API_URL, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await response.json();
    if (data.success && data.channels) {
      displayChannelsList(data.channels);
      return data.channels;
    }
  } catch (error) {
    console.error("Error fetching channels:", error);
    return [];
  }
}

// Display channels in list format
function displayChannelsList(channels) {
  if (!channelsList) return;

  if (channels.length === 0) {
    channelsList.innerHTML = "<p>No channels being tracked. Add one below!</p>";
    return;
  }

  const channelsHTML = channels
    .map(
      (channel) => `
        <div class="channel-item">
            <span class="channel-name">📺 ${channel}</span>
            <button class="delete-button" onclick="deleteChannel('${channel}')" id="delete-${channel}">
                Delete
            </button>
        </div>
    `
    )
    .join("");

  channelsList.innerHTML = `
        <div class="channel-list">
            <h3>Tracked Channels (${channels.length})</h3>
            ${channelsHTML}
        </div>
    `;
}

// Add a new channel
async function addChannel() {
  if (!channelInput || !addButton || !feedback) return;

  const channelName = channelInput.value.trim();

  if (!channelName) {
    feedback.innerHTML =
      '<div class="error-message">Please enter a channel name</div>';
    return;
  }

  const token = localStorage.getItem("authToken");
  if (!token) {
    feedback.innerHTML =
      '<div class="error-message">Please login to add channels</div>';
    return;
  }

  // Disable button and show loading
  addButton.disabled = true;
  addButton.textContent = "Adding...";
  feedback.innerHTML = "";

  try {
    const response = await fetch(`${CHANNELS_API_URL}/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ channelName: channelName }),
    });

    const data = await response.json();

    if (data.success) {
      feedback.innerHTML = `<div class="success-message">${data.message}</div>`;
      channelInput.value = "";

      // Refresh channels list
      await fetchChannels();

      // Clear feedback after 3 seconds
      setTimeout(() => {
        feedback.innerHTML = "";
      }, 3000);
    } else {
      feedback.innerHTML = `<div class="error-message">${data.error}</div>`;
    }
  } catch (error) {
    feedback.innerHTML = `<div class="error-message">Error adding channel: ${error.message}</div>`;
  } finally {
    addButton.disabled = false;
    addButton.textContent = "Add Channel";
  }
}

// Delete a channel
async function deleteChannel(channelName) {
  const button = document.getElementById(`delete-${channelName}`);
  if (!button) return;

  const originalText = button.textContent;

  const token = localStorage.getItem("authToken");
  if (!token) {
    alert("Please login to delete channels");
    return;
  }

  // Disable button and show loading
  button.disabled = true;
  button.textContent = "Deleting...";

  try {
    const response = await fetch(`${CHANNELS_API_URL}/${channelName}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (data.success) {
      // Refresh channels list
      await fetchChannels();

      // Show success message in feedback
      feedback.innerHTML = `<div class="success-message">${data.message}</div>`;
      setTimeout(() => {
        feedback.innerHTML = "";
      }, 3000);
    } else {
      alert(`Error: ${data.error}`);
    }
  } catch (error) {
    alert(`Error deleting channel: ${error.message}`);
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}

// Fetch and display messages
async function fetchMessages() {
  try {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("No authentication token found");
      return;
    }

    const response = await fetch(API_BASE_URL, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.success && data.data) {
      console.log("DATA FROM API:", data.data);
      console.log("TOTAL MESSAGES:", data.data.length);
      data.data.forEach((msg, index) => {
        console.log(`Message ${index + 1}:`, msg);
      });

      displayMessages(data.data);
      displaySuspiciousUsers(data.data);
    } else {
      showError("Failed to load messages: Invalid response format");
    }
  } catch (error) {
    showError(`Error fetching messages: ${error.message}`);
  }
}

// Calculate average sentiment scores for all users
function calculateUserAverages(messages) {
  if (!messages || messages.length === 0) {
    return {};
  }

  const userScores = {};

  messages.forEach((msg) => {
    const username = msg.username || "Unknown";
    const score = msg.sentimentScore || 0;

    if (!userScores[username]) {
      userScores[username] = { total: 0, count: 0 };
    }

    userScores[username].total += score;
    userScores[username].count += 1;
  });

  // Calculate averages
  const averages = {};
  for (const username in userScores) {
    averages[username] =
      userScores[username].total / userScores[username].count;
  }

  return averages;
}

// Get score class and display value based on average score
function getScoreDisplay(avgScore) {
  const roundedScore = Math.round(avgScore * 10) / 10;

  if (roundedScore > 0.5) {
    return {
      class: "positive",
      display: `+${roundedScore.toFixed(1)}`,
    };
  } else if (roundedScore < -0.5) {
    return {
      class: "negative",
      display: roundedScore.toFixed(1),
    };
  } else {
    return {
      class: "neutral",
      display: roundedScore.toFixed(1),
    };
  }
}

// Display messages in the container
function displayMessages(messages) {
  if (!messagesContainer) return;

  if (!messages || messages.length === 0) {
    messagesContainer.innerHTML =
      '<div class="loading">No messages found</div>';
    return;
  }

  // Calculate user averages
  const userAverages = calculateUserAverages(messages);

  const messagesHTML = messages
    .map((msg) => {
      const sentiment = msg.sentiment || "neutral";
      const sentimentClass = `sentiment-${sentiment}`;
      const time = new Date(
        msg.timestamp || msg.createdAt
      ).toLocaleTimeString();
      const channelName = msg.channel || "unknown";
      const username = msg.username || "Unknown";

      // Get user's average score
      const userAvgScore = userAverages[username] || 0;
      const scoreDisplay = getScoreDisplay(userAvgScore);

      // Get individual message sentiment score
      const messageScore = msg.sentimentScore || 0;
      const messageScoreDisplay =
        messageScore > 0 ? `+${messageScore}` : messageScore.toString();
      const messageScoreClass =
        messageScore > 0
          ? "positive"
          : messageScore < 0
          ? "negative"
          : "neutral";

      // Get message date
      const date = new Date(
        msg.timestamp || msg.createdAt
      ).toLocaleDateString();

      return `
            <div class="message-row ${sentimentClass}">
                <div class="message-user-info">
                   
                    <div class="message-username">${username}</div>
                     
                </div>
               
                <div class="message-content">${
                  msg.message || "No message content"
                }</div>
                <div class="message-channel">from the channel ${channelName}</div>
                <div class="message-date">${date}</div>
                <div class="message-time">${time}</div>
                <div class="message-score ${messageScoreClass}">${messageScoreDisplay}</div>
            </div>
        `;
    })
    .join("");

  messagesContainer.innerHTML = messagesHTML;
}

// Display users with negative average sentiment scores
function displaySuspiciousUsers(messages) {
  console.log("displaySuspiciousUsers called with messages:", messages?.length);
  if (!suspiciousUsersContainer) {
    console.error("suspiciousUsersContainer not found!");
    return;
  }

  if (!messages || messages.length === 0) {
    suspiciousUsersContainer.innerHTML =
      "<h3>Suspicious Users</h3><p>No user data available</p>";
    return;
  }

  const userAverages = calculateUserAverages(messages);

  // Calculate total message counts for each user
  const userMessageCounts = {};
  messages.forEach((msg) => {
    const username = msg.username || "Unknown";
    userMessageCounts[username] = (userMessageCounts[username] || 0) + 1;
  });

  console.log("User averages:", userAverages);
  console.log("User message counts:", userMessageCounts);

  // Filter users with negative average scores
  const negativeUsers = Object.entries(userAverages)
    .filter(([username, avgScore]) => avgScore < 0)
    .sort((a, b) => a[1] - b[1]); // Sort by most negative first

  console.log("Negative users:", negativeUsers);

  if (negativeUsers.length === 0) {
    suspiciousUsersContainer.innerHTML =
      "<h3>Suspicious Users</h3><p>No users with negative sentiment detected</p>";
    return;
  }

  const usersHTML = negativeUsers
    .map(([username, avgScore]) => {
      const scoreDisplay = getScoreDisplay(avgScore);
      const messageCount = userMessageCounts[username] || 0;

      // Get only negative messages for this user
      const userNegativeMessages = messages.filter(
        (msg) => msg.username === username && (msg.sentimentScore || 0) < 0
      );

      const negativeMessagesHTML = userNegativeMessages
        .map((msg) => {
          const time = new Date(
            msg.timestamp || msg.createdAt
          ).toLocaleTimeString();
          const score = msg.sentimentScore || 0;
          const scoreDisplay = score > 0 ? `+${score}` : score.toString();
          const scoreClass =
            score > 0 ? "positive" : score < 0 ? "negative" : "neutral";

          return `
                <div class="negative-message-item">
                    <div class="negative-message-content">${
                      msg.message || "No message content"
                    }</div>
                    <div class="negative-message-score score-${scoreClass}">${scoreDisplay}</div>
                    <div class="negative-message-time">${time}</div>
                </div>
            `;
        })
        .join("");

      return `
            <div class="suspicious-user-item" onclick="toggleUserDropdown('${username}')">
                <span class="suspicious-username">${username}</span>
                <span class="suspicious-stats">
                    <span class="suspicious-count">${messageCount} messages send</span>
                    <span class="suspicious-score ${scoreDisplay.class}">Score of  ${scoreDisplay.display}</span>
                </span>
                <div class="user-dropdown" id="dropdown-${username}">
                    <div class="negative-messages">
                        <h4>Negative Messages</h4>
                        ${negativeMessagesHTML}
                    </div>
                    <div class="dropdown-buttons">
                        <button class="dropdown-btn ban-btn" onclick="event.stopPropagation(); banUser('${username}')">Ban</button>
                        <button class="dropdown-btn timeout-btn" onclick="event.stopPropagation(); timeoutUser('${username}')">Time-out</button>
                        <button class="dropdown-btn warning-btn" onclick="event.stopPropagation(); warnUser('${username}')">Warning</button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");

  suspiciousUsersContainer.innerHTML = `
        <h3>Suspicious Users (${negativeUsers.length})</h3>
        <div class="suspicious-users-list">
            ${usersHTML}
        </div>
    `;
}

// Show error message
function showError(message) {
  const errorContainer = document.getElementById("error-container");
  if (errorContainer) {
    errorContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Toggle user dropdown menu
function toggleUserDropdown(username) {
  const dropdown = document.getElementById(`dropdown-${username}`);

  // Close all other dropdowns
  document.querySelectorAll(".user-dropdown").forEach((dd) => {
    if (dd !== dropdown) {
      dd.classList.remove("show");
    }
  });

  // Toggle current dropdown
  dropdown.classList.toggle("show");
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (event) {
  if (!event.target.closest(".suspicious-user-item")) {
    document.querySelectorAll(".user-dropdown").forEach((dd) => {
      dd.classList.remove("show");
    });
  }
});

// Placeholder functions for moderation actions
function banUser(username) {
  alert(`Ban user: ${username}`);
}

function timeoutUser(username) {
  alert(`Time-out user: ${username}`);
}

function warnUser(username) {
  alert(`Send warning to: ${username}`);
}

// Export functions for global access (needed for onclick handlers)
window.addChannel = addChannel;
window.deleteChannel = deleteChannel;
window.toggleUserDropdown = toggleUserDropdown;
window.banUser = banUser;
window.timeoutUser = timeoutUser;
window.warnUser = warnUser;
