class GlobalAnalyticsCharts {
  constructor() {
    this.charts = {};
    this.init();
  }

  async init() {
    await this.loadGlobalData();
    this.createCharts();
  }

  async loadGlobalData() {
    try {
      // Determine API base URL based on current environment
      const isDevServer = window.location.port === '5500' || window.location.hostname === '127.0.0.1';
      const apiBase = isDevServer ? 'http://localhost:3000' : '/api';
      
      // Fetch only leaderboard data for viewer page
      const leaderboardResponse = await fetch(`${apiBase}/leaderboard?global=true`).then(res => res.json());

      // Extract data from response format
      this.leaderboardData = leaderboardResponse.success ? leaderboardResponse.data : leaderboardResponse;
    } catch (error) {
      console.error('Error loading global leaderboard data:', error);
      // Use mock data if API fails
      this.useMockData();
    }
  }

  useMockData() {
    this.leaderboardData = [
      { username: 'StreamViewer123', totalMessages: 234, avgSentiment: 0.3, activityRate: 85, riskLevel: 'low', channelCount: 2 },
      { username: 'ChatUser456', totalMessages: 189, avgSentiment: -0.5, activityRate: 92, riskLevel: 'high', channelCount: 1 },
      { username: 'GamerPro789', totalMessages: 156, avgSentiment: 0.1, activityRate: 67, riskLevel: 'medium', channelCount: 3 },
      { username: 'TwitchFan01', totalMessages: 145, avgSentiment: 0.7, activityRate: 78, riskLevel: 'low', channelCount: 1 },
      { username: 'EmojiKing', totalMessages: 98, avgSentiment: -0.2, activityRate: 45, riskLevel: 'medium', channelCount: 2 }
    ];
  }

  createCharts() {
    this.createLeaderboardChart();
  }

  createSentimentChart() {
    const ctx = document.getElementById('sentimentChart').getContext('2d');
    
    this.charts.sentiment = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [{
          data: [this.sentimentData.positive, this.sentimentData.negative, this.sentimentData.neutral],
          backgroundColor: ['#4caf50', '#f44336', '#ff9800'],
          borderColor: '#2d2d2d',
          borderWidth: 2
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
              padding: 20
            }
          }
        }
      }
    });
  }

  createChannelActivityChart() {
    const ctx = document.getElementById('channelActivityChart').getContext('2d');
    
    this.charts.channelActivity = new Chart(ctx, {
      type: 'line',
      data: this.channelActivityData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#444444'
            }
          },
          x: {
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
    
    // Prepare data for scatter plot
    const userScores = [];
    this.scatterData.forEach(user => {
      if (user.username && user.score !== undefined && user.activity !== undefined) {
        userScores.push({
          x: user.activity,
          y: user.score,
          label: user.username
        });
      }
    });

    // Sort by sentiment score for better visualization
    userScores.sort((a, b) => b.y - a.y);

    this.charts.usersScore = new Chart(ctx, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Users',
          data: userScores,
          backgroundColor: '#6441a5',
          borderColor: '#9146ff',
          pointRadius: 8,
          pointHoverRadius: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            title: {
              display: true,
              text: 'Activity Rate',
              color: '#ffffff'
            },
            min: 0,
            max: 100,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#444444'
            }
          },
          y: {
            title: {
              display: true,
              text: 'Sentiment Score',
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
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const point = context.raw;
                return `${point.label}: Activity ${point.x}%, Score ${point.y.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  createLeaderboardChart() {
    const ctx = document.getElementById('leaderboardChart').getContext('2d');
    
    const topUsers = this.leaderboardData.slice(0, 5);
    
    this.charts.leaderboard = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: topUsers.map(user => user.username),
        datasets: [{
          label: 'Activity Rate',
          data: topUsers.map(user => user.activityRate),
          backgroundColor: topUsers.map(user => {
            switch(user.riskLevel) {
              case 'high': return '#f44336';
              case 'medium': return '#ff9800';
              case 'low': return '#4caf50';
              default: return '#6441a5';
            }
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
            max: 100,
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: '#444444'
            }
          },
          x: {
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
            display: false
          },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const user = topUsers[context.dataIndex];
                return [
                  `Messages: ${user.totalMessages}`,
                  `Risk: ${user.riskLevel}`,
                  `Channels: ${user.channelCount}`
                ];
              }
            }
          }
        }
      }
    });
  }

  refreshCharts() {
    this.loadGlobalData().then(() => {
      // Destroy existing leaderboard chart
      if (this.charts.leaderboard) {
        this.charts.leaderboard.destroy();
      }
      this.charts = {};
      
      // Recreate leaderboard with new data
      this.createLeaderboardChart();
    });
  }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // This is a public global analytics dashboard - no login required
    // But we can still show user info if they're logged in
    
    // Check if user is logged in (optional)
    const userData = localStorage.getItem("userData");
    const authToken = localStorage.getItem("authToken");
    const user = userData && authToken ? JSON.parse(userData) : null;
    
    // Set active navigation link
    setActiveNavLink();
    
    // Display user info in navbar if logged in
    if (user) {
        displayUserInfo();
    } else {
        // Show guest info
        const navbarUser = document.querySelector('.navbar-user');
        navbarUser.innerHTML = '<span class="user-info">Guest User</span>';
    }
    
    // Initialize global analytics charts (always loads - no login required)
    new GlobalAnalyticsCharts();
});