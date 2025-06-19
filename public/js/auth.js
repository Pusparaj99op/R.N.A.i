let currentUser = null;

// Enhanced notification system with sound effects
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    });
    
    // Create notification with enhanced UI
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Different icons based on notification type
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';
    if (type === 'warning') icon = 'exclamation-triangle';
    
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-${icon}" style="font-size: 1.25rem;"></i>
            <div>
                <span style="display: block;">${message}</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Play sound effect based on type (optional)
    /* 
    const audio = new Audio();
    audio.volume = 0.3;
    if (type === 'success') audio.src = 'sounds/success.mp3';
    if (type === 'error') audio.src = 'sounds/error.mp3';
    if (type === 'warning') audio.src = 'sounds/warning.mp3';
    audio.play().catch(e => console.log('Sound not played: Auto-play prevented'));
    */
    
    // Auto-remove after delay
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Enhanced button loading states with better visual feedback
function setButtonLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (!button) return;
    
    if (isLoading) {
        // Save original text
        const originalText = button.textContent.trim();
        button.setAttribute('data-original-text', originalText);
        
        // Disable button and show loading state
        button.disabled = true;
        button.innerHTML = `
            <div class="spinner"></div>
            <span>Processing...</span>
        `;
        button.classList.add('loading');
    } else {
        // Restore button to original state with smooth transition
        button.disabled = false;
        const originalText = button.getAttribute('data-original-text') || 'Submit';
        button.innerHTML = `<span>${originalText}</span>`;
        button.classList.remove('loading');
    }
}

// Enhanced form validation with better visual feedback
function validateForm(formFields) {
    let isValid = true;
    const errors = {};
    
    formFields.forEach(field => {
        const input = document.getElementById(field.id);
        if (!input) return;
        
        // Reset previous validation state
        input.classList.remove('invalid', 'valid');
        const errorElement = document.getElementById(`${field.id}Error`);
        if (errorElement) errorElement.remove();
        
        let fieldValue = input.value.trim();
        let fieldValid = true;
        let errorMessage = '';
        
        // Required field validation
        if (field.required && fieldValue === '') {
            fieldValid = false;
            errorMessage = `${field.label} is required`;
        }
        
        // Pattern validation if provided and field not empty
        if (fieldValid && field.pattern && fieldValue !== '') {
            const regex = new RegExp(field.pattern);
            if (!regex.test(fieldValue)) {
                fieldValid = false;
                errorMessage = field.patternError || `Invalid ${field.label} format`;
            }
        }
        
        // Min/max length validation if provided
        if (fieldValid && field.minLength && fieldValue.length < field.minLength) {
            fieldValid = false;
            errorMessage = `${field.label} must be at least ${field.minLength} characters`;
        }
        
        if (fieldValid && field.maxLength && fieldValue.length > field.maxLength) {
            fieldValid = false;
            errorMessage = `${field.label} must be less than ${field.maxLength} characters`;
        }
        
        // Custom validation function if provided
        if (fieldValid && field.validate && typeof field.validate === 'function') {
            const customValidation = field.validate(fieldValue);
            if (customValidation !== true) {
                fieldValid = false;
                errorMessage = customValidation;
            }
        }
        
        // Update UI based on validation result
        if (!fieldValid) {
            isValid = false;
            errors[field.id] = errorMessage;
            
            // Add error class and message
            input.classList.add('invalid');
            
            // Create and append error message
            const errorDiv = document.createElement('div');
            errorDiv.id = `${field.id}Error`;
            errorDiv.className = 'form-error';
            errorDiv.innerHTML = `<small><i class="fas fa-exclamation-circle"></i> ${errorMessage}</small>`;
            input.parentNode.appendChild(errorDiv);
            
            // Add shake animation
            input.classList.add('shake');
            setTimeout(() => input.classList.remove('shake'), 500);
        } else {
            // Show success state
            input.classList.add('valid');
        }
    });
    
    return { isValid, errors };
}

// Add success/error styles for form fields
const formStyles = `
.form-group input.invalid,
.form-group select.invalid,
.form-group textarea.invalid {
    border-color: var(--danger-color);
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.2);
}

.form-group input.valid,
.form-group select.valid,
.form-group textarea.valid {
    border-color: var(--success-color);
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.2);
}

.form-error {
    color: var(--danger-color);
    margin-top: 0.5rem;
    font-size: 0.85rem;
    animation: fadeIn 0.3s ease-out;
}

.form-error small {
    display: flex;
    align-items: center;
    gap: 0.35rem;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(-5px); }
    to { opacity: 1; transform: translateY(0); }
}

@keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-5px); }
    40%, 80% { transform: translateX(5px); }
}
`;

// Add styles to document
document.addEventListener('DOMContentLoaded', () => {
    const styleElement = document.createElement('style');
    styleElement.textContent = formStyles;
    document.head.appendChild(styleElement);
});

// Enhanced login function with improved validation and feedback
function login() {
    setButtonLoading('loginBtn', true);
    
    const phone = document.getElementById('loginPhone').value.trim();
    
    // Validate form
    const validation = validateForm([
        { 
            id: 'loginPhone', 
            label: 'Phone number', 
            required: true,
            pattern: '^[0-9]{10}$',
            patternError: 'Please enter a valid 10-digit phone number'
        }
    ]);
    
    if (!validation.isValid) {
        setButtonLoading('loginBtn', false);
        showNotification('Please correct the errors in the form', 'error');
        return;
    }
    
    // Simulate API request delay
    setTimeout(() => {
        // For demonstration purposes, allow any phone number
        // In a real app, this would be an API call to validate credentials
        
        const userData = {
            phone: phone,
            name: 'Demo User'
        };
        
        // Save to localStorage (in a real app, this would be a JWT token)
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        setButtonLoading('loginBtn', false);
        showNotification('Login successful! Redirecting to dashboard...', 'success');
        
        // Redirect after a short delay for notification visibility
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1000);
    }, 1500);
}

// Enhanced register function with improved validation and feedback
function register() {
    setButtonLoading('registerBtn', true);
    
    const name = document.getElementById('regName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const age = document.getElementById('regAge').value.trim();
    const gender = document.getElementById('regGender').value;
    const bloodGroup = document.getElementById('regBloodGroup').value.trim();
    const emergencyContact = document.getElementById('regEmergencyContact').value.trim();
    const medicalHistory = document.getElementById('regMedicalHistory').value.trim();
    
    // Get last period date if female
    let lastPeriod = null;
    if (gender === 'F') {
        lastPeriod = document.getElementById('regLastPeriod').value;
    }
    
    // Validate form with enhanced validation
    const validation = validateForm([
        { id: 'regName', label: 'Full name', required: true, minLength: 3 },
        { 
            id: 'regPhone', 
            label: 'Phone number', 
            required: true,
            pattern: '^[0-9]{10}$',
            patternError: 'Please enter a valid 10-digit phone number'
        },
        { 
            id: 'regAge', 
            label: 'Age', 
            required: true,
            validate: (value) => {
                const age = parseInt(value);
                if (isNaN(age) || age <= 0 || age > 120) {
                    return 'Please enter a valid age between 1 and 120';
                }
                return true;
            }
        },
        { id: 'regGender', label: 'Gender', required: true },
        { id: 'regBloodGroup', label: 'Blood group', required: true },
        { 
            id: 'regEmergencyContact', 
            label: 'Emergency contact', 
            required: true,
            pattern: '^[0-9]{10}$',
            patternError: 'Please enter a valid 10-digit emergency contact number'
        }
    ]);
    
    if (!validation.isValid) {
        setButtonLoading('registerBtn', false);
        showNotification('Please correct the errors in the form', 'error');
        return;
    }
    
    // Create user object
    const userData = {
        name,
        phone,
        age,
        gender,
        bloodGroup,
        emergencyContact,
        medicalHistory,
        lastPeriod
    };
    
    // Simulate API request delay
    setTimeout(() => {
        // For demonstration purposes, just save to localStorage
        // In a real app, this would be an API call to register the user
        
        // Save to localStorage (in a real app, this would be a JWT token)
        localStorage.setItem('currentUser', JSON.stringify(userData));
        
        setButtonLoading('registerBtn', false);
        showNotification('Registration successful! Redirecting to dashboard...', 'success');
        
        // Redirect after a short delay for notification visibility
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }, 2000);
}

// Show/hide female-specific fields based on gender selection
if (document.getElementById('regGender')) {
    document.getElementById('regGender').addEventListener('change', function() {
        const femaleFields = document.getElementById('femaleFields');
        if (this.value === 'F') {
            femaleFields.classList.remove('hidden');
        } else {
            femaleFields.classList.add('hidden');
        }
    });
}

// Enhanced demo login function with better feedback
function fillDemoLogin(phone, userName) {
    document.getElementById('loginPhone').value = phone;
    showNotification(`Demo mode: ${userName}`, 'info');
    
    // Apply visual feedback
    const phoneInput = document.getElementById('loginPhone');
    phoneInput.classList.add('valid');
    
    // Focus the login button
    document.getElementById('loginBtn').focus();
    
    // Store the demo user name for later use
    localStorage.setItem('demoUserName', userName);
}

// Check if user is already logged in
function checkAuth() {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser && window.location.pathname.includes('login.html') || 
        currentUser && window.location.pathname.includes('signup.html')) {
        // User is already logged in, redirect to dashboard
        window.location.href = 'index.html';
    } else if (!currentUser && window.location.pathname.includes('index.html')) {
        // User is not logged in, redirect to login
        window.location.href = 'login.html';
    }
}

// Logout function
function logout() {
    // Show confirmation
    if (confirm('Are you sure you want to log out?')) {
        localStorage.removeItem('currentUser');
        showNotification('You have been logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }
}

// Run on page load
document.addEventListener('DOMContentLoaded', checkAuth);
