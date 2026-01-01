// Viewer page functionality
function logout() {
    localStorage.removeItem('userData');
    window.location.href = 'register.html';
}

// Check if user is logged in and is a viewer
function checkAccess() {
    const userData = localStorage.getItem('userData');
    if (!userData) {
        window.location.href = 'register.html';
        return;
    }
    
    const user = JSON.parse(userData);
    if (user.role !== 'viewer') {
        window.location.href = 'index.html';
        return;
    }
    
    // Display user info
    const userInfo = document.querySelector('.viewer-info p');
    if (userInfo) {
        userInfo.innerHTML = `You are logged in as a viewer (${user.email}).`;
    }
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    checkAccess();
});

// Export for global access
window.logout = logout;