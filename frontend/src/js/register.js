// Registration form handler
function handleRegistration(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    const feedback = document.getElementById('register-feedback');
    const registerButton = document.getElementById('register-button');
    
    // Validate inputs
    if (!email || !password || !role) {
        showFeedback('Please fill in all fields', 'error');
        return;
    }
    
    if (password.length < 6) {
        showFeedback('Password must be at least 6 characters', 'error');
        return;
    }
    
    // Disable button and show loading
    registerButton.disabled = true;
    registerButton.textContent = 'Registering...';
    feedback.innerHTML = '';
    
    // Simulate registration (in real app, this would be an API call)
    setTimeout(() => {
        // Store user data in localStorage
        const userData = {
            email: email,
            role: role,
            registeredAt: new Date().toISOString()
        };
        localStorage.setItem('userData', JSON.stringify(userData));
        
        showFeedback('Registration successful! Redirecting...', 'success');
        
        // Redirect based on role
        setTimeout(() => {
            if (role === 'moderator') {
                window.location.href = 'index.html';
            } else {
                window.location.href = 'viewer.html';
            }
        }, 1500);
    }, 1000);
}

function showFeedback(message, type) {
    const feedback = document.getElementById('register-feedback');
    feedback.innerHTML = `<div class="feedback-${type}">${message}</div>`;
    
    // Clear feedback after 5 seconds
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 5000);
}

// Export for global access
window.handleRegistration = handleRegistration;