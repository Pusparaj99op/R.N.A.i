// Enhanced Authentication JavaScript for RescueNet AI

class AuthenticationManager {
    constructor() {
        this.rateLimitAttempts = 0;
        this.maxAttempts = 5;
        this.lockoutTime = 300000; // 5 minutes
        this.sessionTimeout = 1800000; // 30 minutes
        this.twoFactorEnabled = false;
        this.rememberMe = false;
        this.csrfToken = null;
        this.apiBaseUrl = '/api';
        
        this.init();
    }

    async init() {
        await this.getCSRFToken();
        this.setupFormValidation();
        this.setupRateLimiting();
        this.setupTwoFactorAuth();
        this.setupSecurityFeatures();
        this.checkExistingSession();
        this.loadDemoAccounts();
    }

    // Get CSRF Token
    async getCSRFToken() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/csrf-token`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                this.csrfToken = data.csrfToken;
            }
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    }

    // Load Demo Accounts
    async loadDemoAccounts() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/demo-accounts`);
            const data = await response.json();
            
            if (data.accounts) {
                this.displayDemoAccounts(data.accounts);
            }
        } catch (error) {
            console.error('Error loading demo accounts:', error);
        }
    }

    displayDemoAccounts(accounts) {
        const demoAccountsContainer = document.getElementById('demoAccounts');
        if (!demoAccountsContainer) return;

        demoAccountsContainer.innerHTML = accounts.map(account => `
            <div class="demo-account" onclick="authManager.fillDemoAccount('${account.email}', '${account.password}')">
                <div class="demo-account-info">
                    <strong>${account.name}</strong>
                    <p>${account.description}</p>
                    <small>Email: ${account.email}</small>
                </div>
                <div class="demo-account-action">
                    <i class="fas fa-arrow-right"></i>
                </div>
            </div>
        `).join('');
    }

    fillDemoAccount(email, password) {
        const emailInput = document.getElementById('loginPhone');
        const passwordInput = document.getElementById('loginPassword');
        
        if (emailInput && passwordInput) {
            emailInput.value = email;
            passwordInput.value = password;
            
            // Trigger validation
            this.validateEmailOrPhone(emailInput);
        }
    }

    // Form Validation
    setupFormValidation() {
        const loginForm = document.getElementById('loginFormElement');
        const phoneInput = document.getElementById('loginPhone');
        const twoFactorForm = document.getElementById('twoFactorForm');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        if (phoneInput) {
            phoneInput.addEventListener('input', (e) => {
                this.validateEmailOrPhone(e.target);
            });

            phoneInput.addEventListener('blur', (e) => {
                this.validateEmailOrPhone(e.target);
            });
        }

        if (twoFactorForm) {
            twoFactorForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTwoFactorVerification();
            });
        }

        // Setup OTP input handling
        this.setupOTPInputs();
    }

    validateEmailOrPhone(input) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        const value = input.value.trim();
        const errorElement = document.getElementById('phoneError');

        if (!value) {
            this.showFieldError(errorElement, 'Email or phone number is required');
            return false;
        }

        if (!emailRegex.test(value) && !phoneRegex.test(value)) {
            this.showFieldError(errorElement, 'Please enter a valid email address or phone number');
            return false;
        }

        this.hideFieldError(errorElement);
        return true;
    }

    showFieldError(errorElement, message) {
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    hideFieldError(errorElement) {
        if (errorElement) {
            errorElement.classList.remove('show');
        }
    }

    // Rate Limiting
    setupRateLimiting() {
        const storedAttempts = localStorage.getItem('loginAttempts');
        const lastAttempt = localStorage.getItem('lastLoginAttempt');

        if (storedAttempts && lastAttempt) {
            const timeDiff = Date.now() - parseInt(lastAttempt);
            if (timeDiff < this.lockoutTime) {
                this.rateLimitAttempts = parseInt(storedAttempts);
                this.showRateLimitMessage(this.lockoutTime - timeDiff);
            } else {
                // Reset attempts after lockout period
                this.resetLoginAttempts();
            }
        }
    }

    isRateLimited() {
        return this.rateLimitAttempts >= this.maxAttempts;
    }

    incrementLoginAttempts() {
        this.rateLimitAttempts++;
        localStorage.setItem('loginAttempts', this.rateLimitAttempts.toString());
        localStorage.setItem('lastLoginAttempt', Date.now().toString());

        if (this.isRateLimited()) {
            this.showRateLimitMessage(this.lockoutTime);
        }
    }

    resetLoginAttempts() {
        this.rateLimitAttempts = 0;
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
    }

    showRateLimitMessage(timeRemaining) {
        const minutes = Math.ceil(timeRemaining / 60000);
        this.showError(`Too many failed attempts. Please wait ${minutes} minutes before trying again.`);
        this.disableLoginForm(true);
        
        setTimeout(() => {
            this.disableLoginForm(false);
            this.resetLoginAttempts();
        }, timeRemaining);
    }

    disableLoginForm(disabled) {
        const form = document.getElementById('loginFormElement');
        if (form) {
            const inputs = form.querySelectorAll('input, button');
            inputs.forEach(input => {
                input.disabled = disabled;
            });
        }
    }

    // Enhanced Login Handler
    async handleLogin() {
        if (this.isRateLimited()) {
            this.showError('Too many login attempts. Please wait before trying again.');
            return;
        }

        const form = document.getElementById('loginFormElement');
        const formData = new FormData(form);
        const loginData = {
            email: formData.get('phone'), // Using phone field for email
            password: formData.get('password'),
            rememberMe: formData.get('rememberMe') === 'on',
            csrfToken: this.csrfToken
        };

        // Validate inputs
        if (!this.validateLoginForm(loginData)) {
            return;
        }

        try {
            this.showLoading(true);
            
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': this.csrfToken
                },
                credentials: 'include',
                body: JSON.stringify(loginData)
            });

            const data = await response.json();

            if (response.ok) {
                // Store token if provided
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                }

                // Store user data
                if (data.user) {
                    localStorage.setItem('userData', JSON.stringify(data.user));
                }

                // Reset login attempts
                this.resetLoginAttempts();

                // Handle 2FA if required
                if (data.requiresTwoFactor) {
                    this.showTwoFactorStep();
                } else {
                    this.handleLoginSuccess(data);
                }
            } else {
                this.handleLoginError(data.error || 'Login failed');
                this.incrementLoginAttempts();
            }
        } catch (error) {
            console.error('Login error:', error);
            this.handleLoginError('Network error. Please try again.');
            this.incrementLoginAttempts();
        } finally {
            this.showLoading(false);
        }
    }

    validateLoginForm(data) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;

        if (!data.email) {
            this.showError('Email or phone number is required');
            return false;
        }

        // Check if it's email or phone
        if (!emailRegex.test(data.email) && !phoneRegex.test(data.email)) {
            this.showError('Please enter a valid email address or phone number');
            return false;
        }

        if (!data.password) {
            this.showError('Password is required');
            return false;
        }

        if (data.password.length < 6) {
            this.showError('Password must be at least 6 characters long');
            return false;
        }

        return true;
    }

    handleLoginSuccess(data) {
        this.showSuccess('Login successful! Redirecting...');
        
        // Set session timeout if remember me is not checked
        if (!data.user?.rememberMe) {
            this.setSessionTimeout();
        }

        // Redirect to dashboard after short delay
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    handleLoginError(error) {
        this.showError(error);
        
        // Clear password field for security
        const passwordInput = document.getElementById('loginPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
    }

    // Two-Factor Authentication
    setupTwoFactorAuth() {
        const twoFactorToggle = document.getElementById('twoFactorToggle');
        if (twoFactorToggle) {
            twoFactorToggle.addEventListener('change', (e) => {
                this.handleTwoFactorToggle(e.target.checked);
            });
        }
    }

    showTwoFactorStep() {
        const loginStep = document.getElementById('loginStep');
        const twoFactorStep = document.getElementById('twoFactorStep');
        
        if (loginStep && twoFactorStep) {
            loginStep.style.display = 'none';
            twoFactorStep.style.display = 'block';
            
            // Focus on first OTP input
            const firstOtpInput = document.querySelector('.otp-input');
            if (firstOtpInput) {
                firstOtpInput.focus();
            }
        }
    }

    async handleTwoFactorVerification() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        
        if (otp.length !== 6) {
            this.showError('Please enter the complete 6-digit code');
            return;
        }

        try {
            this.showLoading(true);
            
            // Simulate 2FA verification
            const response = await this.verify2FA(otp);
            
            if (response.success) {
                this.showSuccess('Verification successful! Redirecting...');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1500);
            } else {
                this.showError('Invalid verification code. Please try again.');
                this.clearOTPInputs();
            }
        } catch (error) {
            console.error('2FA verification error:', error);
            this.showError('Verification failed. Please try again.');
        } finally {
            this.showLoading(false);
        }
    }

    async verify2FA(code) {
        // Simulate 2FA verification - replace with actual API call
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({ success: code === '123456' || code === '000000' });
            }, 1000);
        });
    }

    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value;
                
                // Only allow digits
                if (!/^\d$/.test(value)) {
                    e.target.value = '';
                    return;
                }
                
                // Move to next input
                if (value && index < otpInputs.length - 1) {
                    otpInputs[index + 1].focus();
                }
            });
            
            input.addEventListener('keydown', (e) => {
                // Handle backspace
                if (e.key === 'Backspace' && !input.value && index > 0) {
                    otpInputs[index - 1].focus();
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text');
                const digits = pasteData.replace(/\D/g, '').slice(0, 6);
                
                digits.split('').forEach((digit, i) => {
                    if (otpInputs[i]) {
                        otpInputs[i].value = digit;
                    }
                });
                
                // Focus on the next empty input or the last input
                const nextIndex = Math.min(digits.length, otpInputs.length - 1);
                otpInputs[nextIndex].focus();
            });
        });
    }

    clearOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach(input => {
            input.value = '';
        });
        if (otpInputs.length > 0) {
            otpInputs[0].focus();
        }
    }

    // Session Management
    checkExistingSession() {
        const token = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        if (token && userData) {
            // Verify token is still valid
            this.verifySession(token);
        }
    }

    async verifySession(token) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/user/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            });

            if (response.ok) {
                // Session is valid, redirect to dashboard if on login page
                if (window.location.pathname.includes('login.html')) {
                    window.location.href = 'index.html';
                }
            } else {
                // Session invalid, clear stored data
                this.clearSession();
            }
        } catch (error) {
            console.error('Session verification error:', error);
            this.clearSession();
        }
    }

    setSessionTimeout() {
        setTimeout(() => {
            this.showSessionExpiredModal();
        }, this.sessionTimeout);
    }

    showSessionExpiredModal() {
        // Show session expired modal
        const modal = document.createElement('div');
        modal.className = 'session-expired-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h3>Session Expired</h3>
                <p>Your session has expired for security reasons. Please log in again.</p>
                <button onclick="authManager.logout()" class="btn btn-primary">Log In Again</button>
            </div>
        `;
        document.body.appendChild(modal);
    }

    clearSession() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.clear();
    }

    // Logout functionality
    async logout() {
        try {
            const token = localStorage.getItem('authToken');
            
            if (token) {
                await fetch(`${this.apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-CSRF-Token': this.csrfToken
                    },
                    credentials: 'include'
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearSession();
            window.location.href = 'login.html';
        }
    }

    // Security Features
    setupSecurityFeatures() {
        // Password visibility toggle
        const passwordToggle = document.getElementById('passwordToggle');
        const passwordInput = document.getElementById('loginPassword');
        
        if (passwordToggle && passwordInput) {
            passwordToggle.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                passwordToggle.innerHTML = type === 'password' ? 
                    '<i class="fas fa-eye"></i>' : 
                    '<i class="fas fa-eye-slash"></i>';
            });
        }

        // Remember me functionality
        const rememberMeCheckbox = document.getElementById('rememberMe');
        if (rememberMeCheckbox) {
            rememberMeCheckbox.addEventListener('change', (e) => {
                this.rememberMe = e.target.checked;
            });
        }

        // Detect potential security threats
        this.setupSecurityMonitoring();
    }

    setupSecurityMonitoring() {
        // Monitor for suspicious activity
        let suspiciousActivity = 0;
        
        // Track rapid form submissions
        let lastSubmission = 0;
        const form = document.getElementById('loginFormElement');
        
        if (form) {
            form.addEventListener('submit', () => {
                const now = Date.now();
                if (now - lastSubmission < 1000) {
                    suspiciousActivity++;
                    if (suspiciousActivity > 3) {
                        this.handleSuspiciousActivity();
                    }
                }
                lastSubmission = now;
            });
        }
    }

    handleSuspiciousActivity() {
        this.showError('Suspicious activity detected. Please wait a moment before trying again.');
        this.disableLoginForm(true);
        
        setTimeout(() => {
            this.disableLoginForm(false);
        }, 5000);
    }

    // UI Helper methods
    showLoading(show) {
        const loginBtn = document.querySelector('.login-btn');
        
        if (loginBtn) {
            loginBtn.disabled = show;
            loginBtn.innerHTML = show ? 
                '<i class="fas fa-spinner fa-spin"></i> Signing In...' : 
                '<i class="fas fa-sign-in-alt"></i> Sign In';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        // Remove existing messages
        const existingMessages = document.querySelectorAll('.auth-message');
        existingMessages.forEach(msg => msg.remove());

        // Create new message
        const messageDiv = document.createElement('div');
        messageDiv.className = `auth-message ${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'check-circle'}"></i>
            <span>${message}</span>
        `;

        // Insert message
        const form = document.getElementById('loginFormElement');
        if (form) {
            form.insertBefore(messageDiv, form.firstChild);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                messageDiv.remove();
            }, 5000);
        }
    }

    // Utility methods
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    validateSecureInput(input) {
        // Basic XSS prevention
        const sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
        return sanitized.trim();
    }
}

// Initialize authentication manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthenticationManager();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationManager;
}
