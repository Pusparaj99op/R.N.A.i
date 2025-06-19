// Enhanced Authentication JavaScript

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
            this.validatePhoneNumber(emailInput);
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

    // Enhanced session management
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

    // UI Helper methods
    showLoading(show) {
        const loginBtn = document.querySelector('.login-btn');
        const loadingSpinner = document.querySelector('.loading-spinner');
        
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

    // ...existing code...
            if (timeDiff < this.lockoutTime) {
                this.rateLimitAttempts = parseInt(storedAttempts);
                if (this.rateLimitAttempts >= this.maxAttempts) {
                    this.showLockoutMessage(this.lockoutTime - timeDiff);
                }
            } else {
                localStorage.removeItem('loginAttempts');
                localStorage.removeItem('lastLoginAttempt');
            }
        }
    }

    checkRateLimit() {
        if (this.rateLimitAttempts >= this.maxAttempts) {
            this.showStatusMessage('Too many failed attempts. Please try again later.', 'error');
            return false;
        }
        return true;
    }

    incrementFailedAttempts() {
        this.rateLimitAttempts++;
        localStorage.setItem('loginAttempts', this.rateLimitAttempts.toString());
        localStorage.setItem('lastLoginAttempt', Date.now().toString());

        const remainingAttempts = this.maxAttempts - this.rateLimitAttempts;
        if (remainingAttempts > 0) {
            this.showStatusMessage(`Login failed. ${remainingAttempts} attempts remaining.`, 'error');
        } else {
            this.showLockoutMessage(this.lockoutTime);
        }
    }

    showLockoutMessage(timeRemaining) {
        const minutes = Math.ceil(timeRemaining / 60000);
        this.showStatusMessage(`Account temporarily locked. Please try again in ${minutes} minutes.`, 'error');
        this.disableLoginForm(true);
        
        setTimeout(() => {
            this.disableLoginForm(false);
            localStorage.removeItem('loginAttempts');
            localStorage.removeItem('lastLoginAttempt');
            this.rateLimitAttempts = 0;
        }, timeRemaining);
    }

    disableLoginForm(disabled) {
        const loginBtn = document.getElementById('loginBtn');
        const phoneInput = document.getElementById('loginPhone');
        
        if (loginBtn) loginBtn.disabled = disabled;
        if (phoneInput) phoneInput.disabled = disabled;
    }

    // Main Login Handler
    async handleLogin() {
        if (!this.checkRateLimit()) return;

        const phoneInput = document.getElementById('loginPhone');
        const twoFactorCheckbox = document.getElementById('enableTwoFactor');
        const rememberMeCheckbox = document.getElementById('rememberMe');

        if (!this.validatePhoneNumber(phoneInput)) {
            return;
        }

        const phone = phoneInput.value.trim();
        this.twoFactorEnabled = twoFactorCheckbox?.checked || false;
        this.rememberMe = rememberMeCheckbox?.checked || false;

        this.showLoadingState(true);

        try {
            // Simulate API call with enhanced security
            const loginData = await this.performSecureLogin(phone);
            
            if (loginData.success) {
                if (this.twoFactorEnabled) {
                    this.showTwoFactorSection(phone);
                } else {
                    this.handleSuccessfulLogin(loginData);
                }
            } else {
                throw new Error(loginData.message || 'Login failed');
            }
        } catch (error) {
            this.handleLoginError(error);
        } finally {
            this.showLoadingState(false);
        }
    }

    async performSecureLogin(phone) {
        // Enhanced demo login with security features
        const demoUsers = {
            '1234567890': { name: 'John Doe', condition: 'Healthy User', success: true },
            '9876543210': { name: 'Jane Smith', condition: 'Diabetic User', success: true },
            '5555551234': { name: 'Robert Brown', condition: 'Heart Patient', success: true },
            '7777778888': { name: 'Emily White', condition: 'Asthma Patient', success: true },
            '1111222233': { name: 'Michael Green', condition: 'Elderly User', success: true }
        };

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        const user = demoUsers[phone];
        if (user) {
            // Generate session token (in real app, this comes from server)
            const sessionToken = this.generateSecureToken();
            
            return {
                success: true,
                user: user,
                token: sessionToken,
                requiresTwoFactor: this.twoFactorEnabled
            };
        } else {
            return {
                success: false,
                message: 'Invalid phone number. Please use one of the demo accounts.'
            };
        }
    }

    generateSecureToken() {
        // Generate a secure session token (simplified for demo)
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let token = '';
        for (let i = 0; i < 64; i++) {
            token += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return token;
    }

    handleSuccessfulLogin(loginData) {
        // Clear failed attempts
        localStorage.removeItem('loginAttempts');
        localStorage.removeItem('lastLoginAttempt');
        this.rateLimitAttempts = 0;

        // Store session data securely
        this.storeSessionData(loginData);

        this.showStatusMessage('Login successful! Redirecting to dashboard...', 'success');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }

    handleLoginError(error) {
        this.incrementFailedAttempts();
        this.showStatusMessage(error.message || 'An error occurred during login', 'error');
    }

    storeSessionData(loginData) {
        const sessionData = {
            user: loginData.user,
            token: loginData.token,
            timestamp: Date.now(),
            rememberMe: this.rememberMe
        };

        if (this.rememberMe) {
            localStorage.setItem('userSession', JSON.stringify(sessionData));
        } else {
            sessionStorage.setItem('userSession', JSON.stringify(sessionData));
        }
    }

    checkExistingSession() {
        const sessionData = JSON.parse(localStorage.getItem('userSession') || 'null') ||
                           JSON.parse(sessionStorage.getItem('userSession') || 'null');

        if (sessionData) {
            const age = Date.now() - sessionData.timestamp;
            const maxAge = sessionData.rememberMe ? 30 * 24 * 60 * 60 * 1000 : this.sessionTimeout;

            if (age < maxAge) {
                this.showStatusMessage('Existing session found. Redirecting...', 'info');
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                return;
            } else {
                // Session expired
                localStorage.removeItem('userSession');
                sessionStorage.removeItem('userSession');
            }
        }
    }

    // Two-Factor Authentication
    setupTwoFactorAuth() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                this.handleOTPInput(e, index);
            });
            
            input.addEventListener('keydown', (e) => {
                this.handleOTPKeydown(e, index);
            });
        });
    }

    handleOTPInput(e, index) {
        const inputs = document.querySelectorAll('.otp-input');
        const value = e.target.value;

        if (value.length === 1 && /^\d$/.test(value)) {
            if (index < inputs.length - 1) {
                inputs[index + 1].focus();
            }
        }

        // Auto-submit when all fields are filled
        const allFilled = Array.from(inputs).every(input => input.value.length === 1);
        if (allFilled) {
            setTimeout(() => this.handleTwoFactorVerification(), 500);
        }
    }

    handleOTPKeydown(e, index) {
        const inputs = document.querySelectorAll('.otp-input');
        
        if (e.key === 'Backspace' && e.target.value === '' && index > 0) {
            inputs[index - 1].focus();
        }
    }

    setupOTPInputs() {
        const otpInputs = document.querySelectorAll('.otp-input');
        otpInputs.forEach(input => {
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const paste = (e.clipboardData || window.clipboardData).getData('text');
                const digits = paste.match(/\d/g);
                
                if (digits && digits.length >= 6) {
                    otpInputs.forEach((otpInput, index) => {
                        if (digits[index]) {
                            otpInput.value = digits[index];
                        }
                    });
                    this.handleTwoFactorVerification();
                }
            });
        });
    }

    showTwoFactorSection(phone) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('twoFactorSection').classList.remove('hidden');
        
        // Send OTP (simulate)
        this.sendOTP(phone);
        this.startOTPTimer();
    }

    async sendOTP(phone) {
        // Simulate sending OTP
        console.log(`Sending OTP to ${phone}`);
        this.showStatusMessage('Verification code sent to your phone', 'info');
    }

    startOTPTimer() {
        let timeLeft = 30;
        const resendBtn = document.querySelector('button[onclick="resendOTP()"]');
        const originalText = resendBtn.innerHTML;
        
        const timer = setInterval(() => {
            resendBtn.innerHTML = `<i class="fas fa-clock"></i> Resend in ${timeLeft}s`;
            resendBtn.disabled = true;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                clearInterval(timer);
                resendBtn.innerHTML = originalText;
                resendBtn.disabled = false;
            }
        }, 1000);
    }

    async handleTwoFactorVerification() {
        const otpInputs = document.querySelectorAll('.otp-input');
        const otp = Array.from(otpInputs).map(input => input.value).join('');
        
        if (otp.length !== 6) {
            this.showStatusMessage('Please enter all 6 digits', 'error');
            return;
        }

        try {
            // Simulate OTP verification
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // For demo, accept any 6-digit code
            if (/^\d{6}$/.test(otp)) {
                const loginData = {
                    success: true,
                    user: { name: 'Demo User', condition: 'Verified' },
                    token: this.generateSecureToken()
                };
                this.handleSuccessfulLogin(loginData);
            } else {
                throw new Error('Invalid verification code');
            }
        } catch (error) {
            this.showStatusMessage('Invalid verification code', 'error');
            otpInputs.forEach(input => {
                input.value = '';
                input.classList.add('error');
            });
            otpInputs[0].focus();
            
            setTimeout(() => {
                otpInputs.forEach(input => input.classList.remove('error'));
            }, 2000);
        }
    }

    // UI Helper Methods
    showLoadingState(loading) {
        const loginBtn = document.getElementById('loginBtn');
        const btnText = loginBtn.querySelector('.btn-text');
        const btnLoader = loginBtn.querySelector('.btn-loader');
        
        if (loading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            loginBtn.disabled = true;
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            loginBtn.disabled = false;
        }
    }

    showStatusMessage(message, type = 'info') {
        const statusElement = document.getElementById('loginStatus');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };
        
        statusElement.innerHTML = `<i class="fas ${icons[type]}"></i> ${message}`;
        statusElement.className = `status-message ${type}`;
        statusElement.classList.remove('hidden');
        
        // Auto-hide after 5 seconds for non-error messages
        if (type !== 'error') {
            setTimeout(() => {
                statusElement.classList.add('hidden');
            }, 5000);
        }
    }

    // Security Features
    setupSecurityFeatures() {
        // Detect suspicious activity
        this.setupSuspiciousActivityDetection();
        
        // Setup session timeout warning
        this.setupSessionTimeout();
        
        // Setup CSRF protection
        this.setupCSRFProtection();
    }

    setupSuspiciousActivityDetection() {
        let rapidClicks = 0;
        const buttons = document.querySelectorAll('button');
        
        buttons.forEach(button => {
            button.addEventListener('click', () => {
                rapidClicks++;
                setTimeout(() => rapidClicks--, 1000);
                
                if (rapidClicks > 10) {
                    this.showStatusMessage('Suspicious activity detected. Please slow down.', 'error');
                    button.disabled = true;
                    setTimeout(() => button.disabled = false, 5000);
                }
            });
        });
    }

    setupSessionTimeout() {
        let inactivityTimer;
        const resetTimer = () => {
            clearTimeout(inactivityTimer);
            inactivityTimer = setTimeout(() => {
                this.showStatusMessage('Session will expire in 2 minutes due to inactivity', 'info');
                setTimeout(() => {
                    localStorage.removeItem('userSession');
                    sessionStorage.removeItem('userSession');
                    window.location.reload();
                }, 120000);
            }, this.sessionTimeout - 120000);
        };

        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });
        
        resetTimer();
    }

    setupCSRFProtection() {
        // Generate CSRF token
        const csrfToken = this.generateSecureToken();
        sessionStorage.setItem('csrfToken', csrfToken);
        
        // Add to forms
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrfToken';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        });
    }
}

// Global Functions for Demo
function fillDemoLogin(phone, description) {
    const phoneInput = document.getElementById('loginPhone');
    if (phoneInput) {
        phoneInput.value = phone;
        phoneInput.dispatchEvent(new Event('input'));
        
        // Scroll to form
        document.querySelector('.form-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // Show info about demo account
        authManager.showStatusMessage(`Demo account selected: ${description}`, 'info');
    }
}

function resendOTP() {
    const phoneInput = document.getElementById('loginPhone');
    if (phoneInput && phoneInput.value) {
        authManager.sendOTP(phoneInput.value);
        authManager.startOTPTimer();
    }
}

function backToLogin() {
    document.getElementById('twoFactorSection').classList.add('hidden');
    document.getElementById('loginForm').style.display = 'block';
    
    // Clear OTP inputs
    document.querySelectorAll('.otp-input').forEach(input => {
        input.value = '';
    });
}

// Initialize Authentication Manager
let authManager;
document.addEventListener('DOMContentLoaded', function() {
    authManager = new AuthenticationManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthenticationManager;
}
