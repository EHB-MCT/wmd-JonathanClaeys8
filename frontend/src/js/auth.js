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

// User logout function
function logout() {
  localStorage.removeItem("userData");
  localStorage.removeItem("authToken");
  window.location.href = "login.html";
}

// Display user info in navbar
function displayUserInfo() {
  const userData = localStorage.getItem("userData");
  const navbarUser = document.querySelector('.navbar-user');
  
  if (userData && navbarUser) {
    const user = JSON.parse(userData);
    
    // Clear existing content
    navbarUser.innerHTML = '';
    
    // Add logout button
    const logoutBtn = document.createElement('button');
    logoutBtn.className = 'logout-btn';
    logoutBtn.textContent = 'Logout';
    logoutBtn.onclick = logout;
    navbarUser.appendChild(logoutBtn);
  } else if (navbarUser) {
    // Clear if not logged in
    navbarUser.innerHTML = '';
  }
}

// Set active navigation link based on current page
function setActiveNavLink() {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
}

// Navigation functions
function goToViewer() {
  window.location.href = 'viewer.html';
}

function goToModerator() {
  window.location.href = 'index.html';
}

// Export auth functions for global access
window.checkModeratorAccess = checkModeratorAccess;
window.checkViewerAccess = checkViewerAccess;
window.logout = logout;
window.displayUserInfo = displayUserInfo;
window.setActiveNavLink = setActiveNavLink;
