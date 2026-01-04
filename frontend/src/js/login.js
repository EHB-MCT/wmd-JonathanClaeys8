// Login form handler
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const feedback = document.getElementById('login-feedback');
    const loginButton = document.getElementById('login-button');
    
    // Validate inputs
    if (!username || !password) {
        showFeedback('Please fill in all fields', 'error');
        return;
    }
    
    // Disable button and show loading
    loginButton.disabled = true;
    loginButton.textContent = 'Logging in...';
    feedback.innerHTML = '';
    
    try {
        const response = await fetch('http://localhost:3000/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }
        
        // Store user data and token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        showFeedback('Login successful! Redirecting...', 'success');
        
// Redirect to viewer page (now index.html)
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
        
    } catch (error) {
        console.error('Login error:', error);
        showFeedback(error.message || 'Login failed', 'error');
        loginButton.disabled = false;
        loginButton.textContent = 'Login';
    }
}

function showFeedback(message, type) {
    const feedback = document.getElementById('login-feedback');
    feedback.innerHTML = `<div class="feedback-${type}">${message}</div>`;
    
    // Clear feedback after 5 seconds
    setTimeout(() => {
        feedback.innerHTML = '';
    }, 5000);
}

// Export for global access
window.handleLogin = handleLogin;