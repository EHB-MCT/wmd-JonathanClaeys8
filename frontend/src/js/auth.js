// Access control for moderator pages
function checkModeratorAccess() {
  const userData = localStorage.getItem("userData");
  if (!userData) {
    window.location.href = "register.html";
    return;
  }

  const user = JSON.parse(userData);
  if (user.role !== "moderator") {
    window.location.href = "viewer.html";
    return;
  }

  return user;
}

function logout() {
  localStorage.removeItem("userData");
  window.location.href = "register.html";
}

// Export for global access
window.checkModeratorAccess = checkModeratorAccess;
window.logout = logout;
