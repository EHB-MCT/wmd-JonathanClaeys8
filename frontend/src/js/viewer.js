// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Check viewer access first
    const user = checkViewerAccess();
    if (!user) return; // Will redirect if not authorized
    
    // Display user email
    displayUserInfo();
});