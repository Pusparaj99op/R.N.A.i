// Profile Management System

class ProfileManager {
    constructor() {
        this.currentStep = 1;
        this.totalSteps = 4;
        this.formData = {};
        this.validationRules = {};
        this.emergencyContactCount = 2;
        
        this.init();
    }

    init() {
        this.setupValidationRules();
        this.setupFormValidation();
        this.setupStepNavigation();
        this.setupDynamicFeatures();
        this.loadSavedData();
    }

    setupValidationRules() {
        this.validationRules = {
            firstName: {
                required: true,
                pattern: /^[A-Za-z\s]{2,50}$/,
                message: 'First name should be 2-50 characters, letters only'
            },
            lastName: {
                required: true,
                pattern: /^[A-Za-z\s]{2,50}$/,
                message: 'Last name should be 2-50 characters, letters only'
            },
            phone: {
                required: true,
                pattern: /^[\+]?[1-9][\d]{9,14}$/,
                message: 'Please enter a valid phone number (10-15 digits)'
            },
            email: {
                required: true,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
            },
            age: {
                required: true,
                min: 13,
                max: 120,
                message: 'Age must be between 13 and 120'
            },
            bloodGroup: {
                required: true,
                message: 'Please select your blood group'
            },
            contact1Name: {
                required: true,
                pattern: /^[A-Za-z\s]{2,50}$/,
                message: 'Contact name should be 2-50 characters, letters only'
            },
            contact1Phone: {
                required: true,
                pattern: /^[\+]?[1-9][\d]{9,14}$/,
                message: 'Please enter a valid phone number for emergency contact'
            },
            agreeTerms: {
                required: true,
                message: 'You must agree to the Terms of Service'
            },
            agreeData: {
                required: true,
                message: 'You must consent to medical data processing'
            }
        };
    }

    setupFormValidation() {
        const form = document.getElementById('registrationForm');
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            // Real-time validation
            input.addEventListener('input', (e) => {
                this.validateField(e.target);
            });

            input.addEventListener('blur', (e) => {
                this.validateField(e.target);
            });

            // Special handling for checkboxes
            if (input.type === 'checkbox') {
                input.addEventListener('change', (e) => {
                    this.validateField(e.target);
                });
            }
        });

        // Form submission
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
    }

    validateField(field) {
        const fieldName = field.name;
        const value = field.type === 'checkbox' ? field.checked : field.value.trim();
        const rules = this.validationRules[fieldName];
        const errorElement = document.getElementById(`${fieldName}Error`);

        if (!rules) return true;

        let isValid = true;
        let errorMessage = '';

        // Required validation
        if (rules.required) {
            if (field.type === 'checkbox' && !value) {
                isValid = false;
                errorMessage = rules.message;
            } else if (field.type !== 'checkbox' && !value) {
                isValid = false;
                errorMessage = `${this.getFieldLabel(fieldName)} is required`;
            }
        }

        // Pattern validation
        if (isValid && rules.pattern && value && !rules.pattern.test(value)) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Range validation
        if (isValid && rules.min !== undefined && value && parseInt(value) < rules.min) {
            isValid = false;
            errorMessage = rules.message;
        }

        if (isValid && rules.max !== undefined && value && parseInt(value) > rules.max) {
            isValid = false;
            errorMessage = rules.message;
        }

        // Email validation
        if (isValid && fieldName === 'email' && value && !this.validateEmail(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }

        // Phone validation with country code support
        if (isValid && (fieldName === 'phone' || fieldName === 'contact1Phone') && value) {
            if (!this.validatePhoneNumber(value)) {
                isValid = false;
                errorMessage = 'Please enter a valid phone number';
            }
        }

        // Display validation result
        this.showFieldValidation(field, errorElement, isValid, errorMessage);
        
        return isValid;
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    validatePhoneNumber(phone) {
        // Remove all non-digit characters except +
        const cleanPhone = phone.replace(/[^\d+]/g, '');
        
        // Check for valid international format or local format
        const intlPattern = /^\+[1-9]\d{10,14}$/;
        const localPattern = /^[1-9]\d{9,14}$/;
        
        return intlPattern.test(cleanPhone) || localPattern.test(cleanPhone);
    }

    getFieldLabel(fieldName) {
        const labels = {
            firstName: 'First Name',
            lastName: 'Last Name',
            phone: 'Phone Number',
            email: 'Email Address',
            age: 'Age',
            bloodGroup: 'Blood Group',
            contact1Name: 'Emergency Contact Name',
            contact1Phone: 'Emergency Contact Phone'
        };
        return labels[fieldName] || fieldName;
    }

    showFieldValidation(field, errorElement, isValid, errorMessage) {
        const inputWrapper = field.closest('.input-wrapper');
        
        if (isValid) {
            field.classList.remove('invalid');
            field.classList.add('valid');
            if (errorElement) {
                errorElement.classList.remove('show');
                errorElement.textContent = '';
            }
        } else {
            field.classList.remove('valid');
            field.classList.add('invalid');
            if (errorElement) {
                errorElement.classList.add('show');
                errorElement.textContent = errorMessage;
            }
        }

        // Update input wrapper validation icons
        if (inputWrapper) {
            const validIcon = inputWrapper.querySelector('.valid-icon');
            const invalidIcon = inputWrapper.querySelector('.invalid-icon');
            
            if (validIcon && invalidIcon) {
                if (isValid && field.value.trim()) {
                    validIcon.style.display = 'block';
                    invalidIcon.style.display = 'none';
                } else if (!isValid) {
                    validIcon.style.display = 'none';
                    invalidIcon.style.display = 'block';
                } else {
                    validIcon.style.display = 'none';
                    invalidIcon.style.display = 'none';
                }
            }
        }
    }

    setupStepNavigation() {
        // Update step navigation based on current step
        this.updateStepNavigation();
    }

    updateStepNavigation() {
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const submitBtn = document.getElementById('submitBtn');

        // Show/hide navigation buttons
        if (this.currentStep === 1) {
            prevBtn.classList.add('hidden');
        } else {
            prevBtn.classList.remove('hidden');
        }

        if (this.currentStep === this.totalSteps) {
            nextBtn.classList.add('hidden');
            submitBtn.classList.remove('hidden');
        } else {
            nextBtn.classList.remove('hidden');
            submitBtn.classList.add('hidden');
        }

        // Update progress indicator
        this.updateProgressIndicator();
    }

    updateProgressIndicator() {
        const steps = document.querySelectorAll('.progress-step');
        
        steps.forEach((step, index) => {
            const stepNumber = index + 1;
            
            if (stepNumber < this.currentStep) {
                step.classList.add('completed');
                step.classList.remove('active');
            } else if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
    }

    validateCurrentStep() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const requiredFields = currentStepElement.querySelectorAll('[required]');
        let isValid = true;
        const errors = [];

        requiredFields.forEach(field => {
            if (!this.validateField(field)) {
                isValid = false;
                const label = this.getFieldLabel(field.name);
                errors.push(`${label} is required or invalid`);
            }
        });

        // Show error summary if validation fails
        if (!isValid) {
            this.showErrorSummary(errors);
            // Focus on first invalid field
            const firstInvalidField = currentStepElement.querySelector('.invalid');
            if (firstInvalidField) {
                firstInvalidField.focus();
                firstInvalidField.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        } else {
            this.hideErrorSummary();
        }

        return isValid;
    }

    showErrorSummary(errors) {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        let errorSummary = currentStepElement.querySelector('.error-summary');
        
        if (!errorSummary) {
            errorSummary = document.createElement('div');
            errorSummary.className = 'error-summary';
            currentStepElement.insertBefore(errorSummary, currentStepElement.firstChild);
        }
        
        errorSummary.innerHTML = `
            <h4><i class="fas fa-exclamation-triangle"></i> Please fix the following errors:</h4>
            <ul>
                ${errors.map(error => `<li>${error}</li>`).join('')}
            </ul>
        `;
    }

    hideErrorSummary() {
        const currentStepElement = document.getElementById(`step${this.currentStep}`);
        const errorSummary = currentStepElement.querySelector('.error-summary');
        if (errorSummary) {
            errorSummary.remove();
        }
    }

    setupDynamicFeatures() {
        // Save progress to localStorage
        this.setupAutoSave();
        
        // Setup dynamic contact addition
        this.setupEmergencyContacts();
        
        // Setup conditional fields
        this.setupConditionalFields();
    }

    setupAutoSave() {
        const form = document.getElementById('registrationForm');
        const inputs = form.querySelectorAll('input, select, textarea');

        inputs.forEach(input => {
            input.addEventListener('input', () => {
                this.saveFormData();
            });
        });
    }

    saveFormData() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        const data = {};

        for (let [key, value] of formData.entries()) {
            if (data[key]) {
                // Handle multiple values (checkboxes)
                if (Array.isArray(data[key])) {
                    data[key].push(value);
                } else {
                    data[key] = [data[key], value];
                }
            } else {
                data[key] = value;
            }
        }

        localStorage.setItem('registrationFormData', JSON.stringify(data));
    }

    loadSavedData() {
        const savedData = localStorage.getItem('registrationFormData');
        if (!savedData) return;

        try {
            const data = JSON.parse(savedData);
            const form = document.getElementById('registrationForm');

            Object.keys(data).forEach(key => {
                const field = form.querySelector(`[name="${key}"]`);
                if (field) {
                    if (field.type === 'checkbox') {
                        field.checked = data[key] === 'on' || data[key] === true;
                    } else {
                        field.value = data[key];
                    }
                }
            });

            this.showStatusMessage('Previous form data has been restored', 'info');
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    setupEmergencyContacts() {
        // Implementation for adding more emergency contacts
        // This would create new contact forms dynamically
    }

    setupConditionalFields() {
        // Show/hide fields based on other selections
        const medicalConditions = document.querySelectorAll('input[name="medicalConditions"]');
        
        medicalConditions.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.handleMedicalConditionChange();
            });
        });
    }

    handleMedicalConditionChange() {
        // Add conditional logic for medical conditions
        // For example, show additional fields for diabetes management
    }

    async handleRegistration() {
        // Validate all steps
        let allValid = true;
        for (let step = 1; step <= this.totalSteps; step++) {
            const stepElement = document.getElementById(`step${step}`);
            const requiredFields = stepElement.querySelectorAll('[required]');
            
            requiredFields.forEach(field => {
                if (!this.validateField(field)) {
                    allValid = false;
                }
            });
        }

        if (!allValid) {
            this.showStatusMessage('Please fix all validation errors before submitting', 'error');
            return;
        }

        // Show loading state
        this.showLoadingState(true);

        try {
            // Collect form data
            const formData = this.collectFormData();
            
            // Simulate API call
            const result = await this.submitRegistration(formData);
            
            if (result.success) {
                this.showRegistrationSuccess();
                // Clear saved data
                localStorage.removeItem('registrationFormData');
            } else {
                throw new Error(result.message || 'Registration failed');
            }
        } catch (error) {
            this.showStatusMessage(error.message, 'error');
        } finally {
            this.showLoadingState(false);
        }
    }

    collectFormData() {
        const form = document.getElementById('registrationForm');
        const formData = new FormData(form);
        const data = {
            personal: {},
            medical: {},
            contacts: [],
            security: {},
            timestamp: new Date().toISOString()
        };

        // Organize data by sections
        for (let [key, value] of formData.entries()) {
            if (['firstName', 'lastName', 'phone', 'email', 'age', 'gender'].includes(key)) {
                data.personal[key] = value;
            } else if (['bloodGroup', 'height', 'weight', 'activityLevel', 'medications'].includes(key)) {
                data.medical[key] = value;
            } else if (key.startsWith('contact')) {
                // Handle emergency contacts
                const contactIndex = key.match(/\d+/)?.[0];
                if (contactIndex) {
                    if (!data.contacts[contactIndex - 1]) {
                        data.contacts[contactIndex - 1] = {};
                    }
                    const fieldName = key.replace(/contact\d+/, '').toLowerCase();
                    data.contacts[contactIndex - 1][fieldName] = value;
                }
            } else if (['enableTwoFactor', 'enableLocationTracking', 'enableEmergencySharing', 'marketingEmails'].includes(key)) {
                data.security[key] = value === 'on';
            }
        }

        // Handle medical conditions (checkboxes)
        const medicalConditions = [];
        const conditionCheckboxes = form.querySelectorAll('input[name="medicalConditions"]:checked');
        conditionCheckboxes.forEach(checkbox => {
            medicalConditions.push(checkbox.value);
        });
        data.medical.conditions = medicalConditions;

        return data;
    }

    async submitRegistration(formData) {
        // Simulate API call with realistic delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        // For demo purposes, always succeed
        // In real implementation, this would make an actual API call
        return {
            success: true,
            userId: 'user_' + Date.now(),
            message: 'Registration successful'
        };
    }

    showRegistrationSuccess() {
        const form = document.getElementById('registrationForm');
        const navigation = document.querySelector('.form-navigation');
        
        form.innerHTML = `
            <div class="registration-success">
                <div class="success-icon">
                    <i class="fas fa-check"></i>
                </div>
                <h3>Registration Successful!</h3>
                <p>Your RescueNet AI account has been created successfully. You can now access your dashboard and start monitoring your health.</p>
                <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
                    <a href="login.html" class="btn btn-primary">
                        <i class="fas fa-sign-in-alt"></i> Login Now
                    </a>
                    <a href="home.html" class="btn btn-secondary">
                        <i class="fas fa-home"></i> Go to Home
                    </a>
                </div>
            </div>
        `;
        
        navigation.style.display = 'none';
        
        // Update progress indicator to show completion
        const steps = document.querySelectorAll('.progress-step');
        steps.forEach(step => step.classList.add('completed'));
    }

    showLoadingState(loading) {
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoader = submitBtn.querySelector('.btn-loader');
        const form = document.getElementById('registrationForm');
        
        if (loading) {
            btnText.classList.add('hidden');
            btnLoader.classList.remove('hidden');
            submitBtn.disabled = true;
            form.classList.add('form-loading');
        } else {
            btnText.classList.remove('hidden');
            btnLoader.classList.add('hidden');
            submitBtn.disabled = false;
            form.classList.remove('form-loading');
        }
    }

    showStatusMessage(message, type = 'info') {
        const statusElement = document.getElementById('registrationStatus');
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
        
        // Scroll to message
        statusElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Global functions for step navigation
function changeStep(direction) {
    if (!window.profileManager) return;
    
    const newStep = window.profileManager.currentStep + direction;
    
    if (direction > 0 && !window.profileManager.validateCurrentStep()) {
        return;
    }
    
    if (newStep >= 1 && newStep <= window.profileManager.totalSteps) {
        // Hide current step
        const currentStepElement = document.getElementById(`step${window.profileManager.currentStep}`);
        currentStepElement.classList.remove('active');
        
        // Show new step
        window.profileManager.currentStep = newStep;
        const newStepElement = document.getElementById(`step${newStep}`);
        newStepElement.classList.add('active');
        
        // Add animation class
        if (direction > 0) {
            newStepElement.classList.add('entering-next');
        } else {
            newStepElement.classList.add('entering-prev');
        }
        
        // Remove animation class after animation completes
        setTimeout(() => {
            newStepElement.classList.remove('entering-next', 'entering-prev');
        }, 300);
        
        // Update navigation
        window.profileManager.updateStepNavigation();
        
        // Focus on first input in new step
        const firstInput = newStepElement.querySelector('input, select, textarea');
        if (firstInput) {
            setTimeout(() => firstInput.focus(), 100);
        }
        
        // Scroll to top of form
        document.querySelector('.auth-card').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Save progress
        window.profileManager.saveFormData();
    }
}

function addEmergencyContact() {
    const contactsContainer = document.getElementById('emergencyContacts');
    const contactCount = contactsContainer.querySelectorAll('.emergency-contact-item').length + 1;
    
    const contactHTML = `
        <div class="emergency-contact-item">
            <h4>Emergency Contact ${contactCount} (Optional)</h4>
            <div class="form-row">
                <div class="form-group">
                    <label for="contact${contactCount}Name">
                        <i class="fas fa-user"></i> Full Name
                    </label>
                    <div class="input-wrapper">
                        <i class="fas fa-user input-icon"></i>
                        <input 
                            type="text" 
                            id="contact${contactCount}Name" 
                            name="contact${contactCount}Name"
                            placeholder="Contact ${contactCount} name"
                        >
                    </div>
                </div>

                <div class="form-group">
                    <label for="contact${contactCount}Phone">
                        <i class="fas fa-phone"></i> Phone Number
                    </label>
                    <div class="input-wrapper">
                        <i class="fas fa-phone input-icon"></i>
                        <input 
                            type="tel" 
                            id="contact${contactCount}Phone" 
                            name="contact${contactCount}Phone"
                            placeholder="Contact ${contactCount} phone"
                        >
                    </div>
                </div>
            </div>
            <button type="button" class="btn btn-outline" onclick="removeEmergencyContact(this)">
                <i class="fas fa-trash"></i> Remove Contact
            </button>
        </div>
    `;
    
    const addButton = document.querySelector('.add-contact-btn');
    addButton.insertAdjacentHTML('beforebegin', contactHTML);
    
    // Limit to 5 contacts
    if (contactCount >= 5) {
        addButton.style.display = 'none';
    }
}

function removeEmergencyContact(button) {
    const contactItem = button.closest('.emergency-contact-item');
    contactItem.remove();
    
    // Show add button if hidden
    const addButton = document.querySelector('.add-contact-btn');
    addButton.style.display = 'flex';
}

// Initialize Profile Manager
document.addEventListener('DOMContentLoaded', function() {
    window.profileManager = new ProfileManager();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProfileManager;
}
