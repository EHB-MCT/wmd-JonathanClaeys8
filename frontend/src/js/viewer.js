// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check viewer access first
    const user = checkViewerAccess();
    if (!user) return; // Will redirect if not authorized
    
    // Set active navigation link
    setActiveNavLink();
    
    // Display user info in navbar
    displayUserInfo();
});