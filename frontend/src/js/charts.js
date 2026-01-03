class AnalyticsCharts {
  constructor() {
    this.charts = {};
    this.init();
  }

  async init() {
    await this.loadData();
    this.createCharts();
  }

  async loadData() {
    try {
      // Determine API base URL based on current environment
      const isDevServer = window.location.port === '5500' || window.location.hostname === '127.0.0.1';
      const apiBase = isDevServer ? 'http://localhost:3000' : '/api';
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('authToken');
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // Add authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      // Fetch all necessary data with authentication headers
      const [sentimentResponse, scatterResponse, activityResponse] = await Promise.all([
        fetch(`${apiBase}/sentiment-distribution`, { headers }).then(res => res.json()),
        fetch(`${apiBase}/scatterplot`, { headers }).then(res => res.json()),
        fetch(`${apiBase}/channel-activity`, { headers }).then(res => res.json())
      ]);

      // Extract data from response format
      this.sentimentData = sentimentResponse.success ? sentimentResponse.data : sentimentResponse;
      this.scatterData = scatterResponse.success ? scatterResponse.data : scatterResponse;
      this.channelActivityData = activityResponse.success ? activityResponse.data : activityResponse;
    } catch (error) {
      console.error('Error loading chart data:', error);
      // Use mock data if API fails
      this.useMockData();
    }
  }

  useMockData() {
    this.sentimentData = {
      positive: 145,
      negative: 67,
      neutral: 89
    };

    this.scatterData = [
      { username: 'StreamViewer123', activityRate: 85, avgSentiment: 0.3, totalMessages: 234 },
      { username: 'ChatUser456', activityRate: 92, avgSentiment: -0.5, totalMessages: 189 },
      { username: 'GamerPro789', activityRate: 67, avgSentiment: 0.1, totalMessages: 156 },
      { username: 'TwitchFan01', activityRate: 78, avgSentiment: 0.7, totalMessages: 145 },
      { username: 'EmojiKing', activityRate: 45, avgSentiment: -0.2, totalMessages: 98 }
    ];

    this.channelActivityData = [
      { hour: '17:00', count: 34 },
      { hour: '18:00', count: 45 },
      { hour: '19:00', count: 67 },
      { hour: '20:00', count: 89 },
      { hour: '21:00', count: 123 },
      { hour: '22:00', count: 98 }
    ];
  }

  createCharts() {
    this.createSentimentChart();
    this.createChannelActivityChart();
    this.createUsersScoreChart();
  }

  createSentimentChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    // Use real sentiment distribution data from Twitch chat messages
    const sentiments = this.sentimentData || { positive: 0, negative: 0, neutral: 0 };

    this.charts.sentiment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [sentiments.positive, sentiments.negative, sentiments.neutral],
          backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
          borderWidth: 2,
          borderColor: '#2d2d2d'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#ffffff',
              padding: 15,
              font: {
                size: 12
              }
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((context.parsed / total) * 100).toFixed(1);
                return `${context.label}: ${context.parsed} messages (${percentage}%)`;
              }
            }
          }
        }
      }
    });
  }

  createChannelActivityChart() {
    const ctx = document.getElementById('channelActivityChart').getContext('2d');
    
    let hours = [];
    let messageCounts = [];
    
    // Use real channel activity data if available
    if (this.channelActivityData && this.channelActivityData.length > 0) {
      hours = this.channelActivityData.map(item => item.hour);
      messageCounts = this.channelActivityData.map(item => item.count);
    } else {
      // Fallback to generated data
      const now = new Date();
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
        hours.push(hour.getHours() + ':00');
        messageCounts.push(Math.floor(Math.random() * 50) + 10 + (hour.getHours() >= 18 && hour.getHours() <= 22 ? 30 : 0));
      }
    }

    this.charts.channelActivity = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          label: 'Messages per Hour',
          data: messageCounts,
          borderColor: '#6441a5',
          backgroundColor: 'rgba(100, 65, 165, 0.1)',
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#9147ff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Time (Last 24 Hours)',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              color: '#444444'
            }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Message Count',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#444444'
            }
          }
        },
        plugins: {
          legend: {
            labels: {
              color: '#ffffff'
            }
          }
        }
      }
    });
  }



  createUsersScoreChart() {
    const ctx = document.getElementById('usersScoreChart').getContext('2d');
    
    // Use real Twitch chat user data from scatter
    const userScores = [];
    if (this.scatterData && this.scatterData.length > 0) {
      this.scatterData.slice(0, 15).forEach(user => { // Top 15 users
        userScores.push({
          username: user.username,
          score: user.avgSentiment || user.score,
          activity: user.activityRate || user.activity,
          messages: user.totalMessages || user.messages
        });
      });
    }

    // Sort by sentiment score for better visualization
    userScores.sort((a, b) => b.score - a.score);

    this.charts.usersScore = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: userScores.map(user => user.username),
        datasets: [{
          label: 'Average Sentiment Score',
          data: userScores.map(user => user.score),
          backgroundColor: userScores.map(user => {
            if (user.score > 0.1) return '#4caf50';  // Positive
            if (user.score < -0.1) return '#f44336'; // Negative
            return '#ff9800'; // Neutral
          }),
          borderColor: '#2d2d2d',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            max: 1,
            min: -1,
            title: {
              display: true,
              text: 'Average Sentiment Score',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff',
              callback: function(value) {
                return value.toFixed(1);
              }
            },
            grid: {
              color: '#444444'
            }
          },
          x: {
            title: {
              display: true,
              text: 'Twitch Chat Users',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff',
              maxRotation: 45,
              minRotation: 45
            },
            grid: {
              color: '#444444'
            }
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const user = userScores[context.dataIndex];
                return [
                  `User: ${user.username}`,
                  `Score: ${user.score.toFixed(2)}`,
                  `Activity: ${user.activity}%`,
                  `Messages: ${user.messages}`
                ];
              }
            }
          }
        }
      }
    });
  }

  updateCharts() {
    // Method to refresh all charts with new data
    Object.values(this.charts).forEach(chart => chart.destroy());
    this.charts = {};
    this.loadData().then(() => this.createCharts());
  }
}

// Initialize charts immediately when script loads with DOM ready check
function initChartsWhenReady() {
  console.log('🔍 Charts.js: Initializing charts');
  console.log('🔍 DOM Ready State:', document.readyState);
  
  const userData = localStorage.getItem('userData');
  const authToken = localStorage.getItem('authToken');
  console.log('🔍 User Data:', userData ? 'EXISTS' : 'MISSING');
  console.log('🔍 Auth Token:', authToken ? 'EXISTS' : 'MISSING');
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log('🔍 Charts.js: DOM loaded, creating AnalyticsCharts');
      new AnalyticsCharts();
    });
  } else {
    // DOM is already loaded
    console.log('🔍 Charts.js: DOM already loaded, creating AnalyticsCharts');
    new AnalyticsCharts();
  }
}

initChartsWhenReady();

// Export for potential external use
window.AnalyticsCharts = AnalyticsCharts;