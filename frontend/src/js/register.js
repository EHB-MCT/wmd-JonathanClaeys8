// Registration form handler
async function handleRegistration(event) {
    event.preventDefault();
    
const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const feedback = document.getElementById('register-feedback');
    const registerButton = document.getElementById('register-button');
    
// Validate inputs
    if (!username || !password) {
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
    
    try {
        const response = await fetch('http://localhost:3000/auth/register', {
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
            throw new Error(data.error || 'Registration failed');
        }
        
        // Store user data and token in localStorage
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        showFeedback('Registration successful! Redirecting...', 'success');
        
// Redirect to viewer page
        setTimeout(() => {
            window.location.href = 'viewer.html';
        }, 1500);
        
    } catch (error) {
        console.error('Registration error:', error);
        showFeedback(error.message || 'Registration failed', 'error');
        registerButton.disabled = false;
        registerButton.textContent = 'Register';
    }
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