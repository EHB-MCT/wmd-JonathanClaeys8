// Access control for moderator pages
function checkModeratorAccess() {
  const userData = localStorage.getItem("userData");
  const authToken = localStorage.getItem("authToken");
  
  if (!userData || !authToken) {
    window.location.href = "login.html";
    return;
  }

  const user = JSON.parse(userData);
  if (user.role !== "moderator") {
    window.location.href = "viewer.html";
    return;
  }

  return user;
}

// Access control for viewer pages
function checkViewerAccess() {
  const userData = localStorage.getItem("userData");
  const authToken = localStorage.getItem("authToken");
  
  if (!userData || !authToken) {
    window.location.href = "login.html";
    return;
  }

  return JSON.parse(userData);
}

function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

// Display user username in the UI
function displayUserInfo() {
  const userData = localStorage.getItem("userData");
  if (userData) {
    const user = JSON.parse(userData);
    
    // Update index.html (moderator page)
    const moderatorInfo = document.querySelector('.moderator-info');
    if (moderatorInfo && user.username) {
      const usernameSpan = document.createElement('span');
      usernameSpan.className = 'user-email';
      usernameSpan.textContent = `Logged in as: ${user.username}`;
      moderatorInfo.insertBefore(usernameSpan, moderatorInfo.firstChild);
    }
    
    // Update viewer.html
    const viewerInfo = document.querySelector('.viewer-info');
    if (viewerInfo && user.username) {
      const usernameP = document.createElement('p');
      usernameP.className = 'user-email';
      usernameP.textContent = `Logged in as: ${user.username}`;
      viewerInfo.insertBefore(usernameP, viewerInfo.firstChild);
    }
  }
}

// Export for global access
window.checkModeratorAccess = checkModeratorAccess;
window.checkViewerAccess = checkViewerAccess;
window.logout = logout;
window.displayUserInfo = displayUserInfo;
