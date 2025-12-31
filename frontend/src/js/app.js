// Configuration
const API_BASE_URL = 'http://localhost/api/data';
const CHANNELS_API_URL = 'http://localhost/api/channels';

// DOM Elements
let channelsList, messagesContainer, channelInput, addButton, feedback;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    initializeElements();
    setupEventListeners();
    init();
});

function initializeElements() {
    channelsList = document.getElementById('channels-list');
    messagesContainer = document.getElementById('messages-container');
    channelInput = document.getElementById('channel-input');
    addButton = document.getElementById('add-button');
    feedback = document.getElementById('add-channel-feedback');
}

function setupEventListeners() {
    // Handle Enter key in channel input
    if (channelInput) {
        channelInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
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
        const response = await fetch(CHANNELS_API_URL);
        const data = await response.json();
        if (data.success && data.channels) {
            displayChannelsList(data.channels);
            return data.channels;
        }
    } catch (error) {
        console.error('Error fetching channels:', error);
        return [];
    }
}

// Display channels in list format
function displayChannelsList(channels) {
    if (!channelsList) return;
    
    if (channels.length === 0) {
        channelsList.innerHTML = '<p>No channels being tracked. Add one below!</p>';
        return;
    }
    
    const channelsHTML = channels.map(channel => `
        <div class="channel-item">
            <span class="channel-name">📺 ${channel}</span>
            <button class="delete-button" onclick="deleteChannel('${channel}')" id="delete-${channel}">
                Delete
            </button>
        </div>
    `).join('');
    
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
        feedback.innerHTML = '<div class="error-message">Please enter a channel name</div>';
        return;
    }
    
    // Disable button and show loading
    addButton.disabled = true;
    addButton.textContent = 'Adding...';
    feedback.innerHTML = '';
    
    try {
        const response = await fetch(`${CHANNELS_API_URL}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ channelName: channelName })
        });
        
        const data = await response.json();
        
        if (data.success) {
            feedback.innerHTML = `<div class="success-message">${data.message}</div>`;
            channelInput.value = '';
            
            // Refresh channels list
            await fetchChannels();
            
            // Clear feedback after 3 seconds
            setTimeout(() => {
                feedback.innerHTML = '';
            }, 3000);
        } else {
            feedback.innerHTML = `<div class="error-message">${data.error}</div>`;
        }
    } catch (error) {
        feedback.innerHTML = `<div class="error-message">Error adding channel: ${error.message}</div>`;
    } finally {
        addButton.disabled = false;
        addButton.textContent = 'Add Channel';
    }
}

// Delete a channel
async function deleteChannel(channelName) {
    if (!confirm(`Are you sure you want to stop tracking "${channelName}"?`)) {
        return;
    }
    
    const button = document.getElementById(`delete-${channelName}`);
    if (!button) return;
    
    const originalText = button.textContent;
    
    // Disable button and show loading
    button.disabled = true;
    button.textContent = 'Deleting...';
    
    try {
        const response = await fetch(`${CHANNELS_API_URL}/${channelName}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Refresh channels list
            await fetchChannels();
            
            // Show success message in feedback
            feedback.innerHTML = `<div class="success-message">${data.message}</div>`;
            setTimeout(() => {
                feedback.innerHTML = '';
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
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.data) {
            displayMessages(data.data);
        } else {
            showError('Failed to load messages: Invalid response format');
        }
    } catch (error) {
        showError(`Error fetching messages: ${error.message}`);
    }
}

// Display messages in the container
function displayMessages(messages) {
    if (!messagesContainer) return;
    
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = '<div class="loading">No messages found</div>';
        return;
    }

    const messagesHTML = messages.map(msg => {
        const sentiment = msg.sentiment || 'neutral';
        const sentimentClass = `sentiment-${sentiment}`;
        const time = new Date(msg.timestamp || msg.createdAt).toLocaleTimeString();
        const channelName = msg.channel || 'unknown';
        
        return `
            <div class="message-row ${sentimentClass}">
                <div class="message-channel">${channelName}</div>
                <div class="message-username">${msg.username || 'Unknown'}</div>
                <div class="message-content">${msg.message || 'No message content'}</div>
                <div class="message-time">${time}</div>
            </div>
        `;
    }).join('');

    messagesContainer.innerHTML = messagesHTML;
}

// Show error message
function showError(message) {
    const errorContainer = document.getElementById('error-container');
    if (errorContainer) {
        errorContainer.innerHTML = `<div class="error">${message}</div>`;
    }
}

// Export functions for global access (needed for onclick handlers)
window.addChannel = addChannel;
window.deleteChannel = deleteChannel;