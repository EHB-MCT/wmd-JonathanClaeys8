// Access control for moderator pages (now allows all authenticated users)
function checkModeratorAccess() {
  const userData = localStorage.getItem("userData");
  const authToken = localStorage.getItem("authToken");
  
  if (!userData || !authToken) {
    window.location.href = "login.html";
    return;
  }

  return JSON.parse(userData);
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
  const navbarMenu = document.querySelector('.navbar-menu');
  const navbarUser = document.querySelector('.navbar-user');
  
  if (userData && navbarMenu) {
    const user = JSON.parse(userData);
    
    // Remove existing user info nav item if present
    const existingUserInfo = document.querySelector('.user-info-nav');
    if (existingUserInfo) {
      existingUserInfo.remove();
    }
    
    // Add username as a nav item
    const userInfoLi = document.createElement('li');
    userInfoLi.className = 'nav-item user-info-nav';
    
    const userInfoLink = document.createElement('span');
    userInfoLink.className = 'nav-link user-info';
    userInfoLink.textContent = user.username;
    
    userInfoLi.appendChild(userInfoLink);
    navbarMenu.appendChild(userInfoLi);
  } else {
    // Remove existing user info nav item if not logged in
    const existingUserInfo = document.querySelector('.user-info-nav');
    if (existingUserInfo) {
      existingUserInfo.remove();
    }
  }
  
  // Handle logout button in navbar-user section
  if (userData && navbarUser) {
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
