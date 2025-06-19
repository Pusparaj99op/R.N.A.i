let currentUser = null;
let map = null;
let userMarker = null;
let healthChart = null;
let ws = null;
let emergencyStatus = false;
let emergencyTimeout = null;
let lastVitalReadings = {};
let notificationQueue = [];
let animationFrame = null;

// Initialize the dashboard
document.addEventListener('DOMContentLoaded', () => {
    // Add particle background for modern UI effect
    initParticleBackground();
    
    // Check user authentication
    checkAuth();
    
    // Load and display user data
    loadUserData();
    
    // Initialize real-time updates
    initWebSocket();
    
    // Initialize map with modern styling
    initMap();
    
    // Initialize health chart with animation
    initHealthChart();
    
    // Load emergency history
    loadEmergencyHistory();
    
    // Load health statistics
    loadHealthStats();
    
    // Add event listeners
    document.getElementById('emergencyAlert')?.addEventListener('click', dismissEmergencyAlert);
    
    // Initialize the notification system
    initNotificationSystem();
    
    // Add responsive menu toggle
    const menuToggle = document.querySelector('.menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            document.querySelector('.sidebar').classList.toggle('active');
        });
    }
    
    // Add theme toggle
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
        
        // Set initial theme state
        if (localStorage.getItem('darkMode') === 'true') {
            document.body.classList.add('dark-mode');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    }
});

// Create animated particle background effect
function initParticleBackground() {
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.appendChild(particlesContainer);
    
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }
}

// Create individual floating particle
function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random size
    const size = Math.random() * 10 + 3;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;
    
    // Random position
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    
    // Random opacity
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    
    // Random animation duration
    const duration = Math.random() * 20 + 10;
    particle.style.animation = `float ${duration}s infinite ease-in-out`;
    
    // Random delay
    particle.style.animationDelay = `${Math.random() * 5}s`;
    
    container.appendChild(particle);
}

// Toggle between light and dark theme
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    
    body.classList.toggle('dark-mode');
    const isDarkMode = body.classList.contains('dark-mode');
    
    // Update theme toggle icon
    themeToggle.innerHTML = isDarkMode ? 
        '<i class="fas fa-sun"></i>' : 
        '<i class="fas fa-moon"></i>';
    
    // Save preference
    localStorage.setItem('darkMode', isDarkMode);
    
    // Reinitialize charts with theme-appropriate colors
    if (healthChart) {
        const theme = isDarkMode ? 'dark' : 'light';
        updateChartTheme(healthChart, theme);
    }
}

// Update chart theme based on current mode
function updateChartTheme(chart, theme) {
    const textColor = theme === 'dark' ? '#ffffff' : '#333333';
    const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    
    chart.options.scales.x.ticks.color = textColor;
    chart.options.scales.y.ticks.color = textColor;
    chart.options.scales.x.grid.color = gridColor;
    chart.options.scales.y.grid.color = gridColor;
    chart.options.plugins.legend.labels.color = textColor;
    chart.options.plugins.title.color = textColor;
    
    chart.update();
}

// Initialize notification system
function initNotificationSystem() {
    const notificationsContainer = document.getElementById('notificationsContainer');
    
    if (!notificationsContainer) {
        const container = document.createElement('div');
        container.id = 'notificationsContainer';
        container.className = 'notifications-container';
        document.body.appendChild(container);
    }
}

// Check if user is authenticated
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'login.html';
        return false;
    }
    
    try {
        currentUser = JSON.parse(userStr);
        return true;
    } catch (e) {
        localStorage.removeItem('currentUser');
        window.location.href = 'login.html';
        return false;
    }
}

// Load and display user data with enhanced UI
function loadUserData() {
    if (!currentUser) return;
    
    const userInfoDiv = document.getElementById('userInfo');
    if (!userInfoDiv) return;
    
    // Create user info HTML with better layout and modern UI elements
    const formattedUserInfo = `
        <div class="user-profile">
            <div class="user-avatar">
                <i class="fas fa-user-circle"></i>
                <div class="user-status ${getRandomStatus()}"></div>
            </div>
            <div class="user-details">
                <h4>${currentUser.name}</h4>
                <p>${currentUser.phone}</p>
                <span class="user-badge">Premium</span>
            </div>
            <button class="edit-profile-btn" aria-label="Edit Profile">
                <i class="fas fa-edit"></i>
            </button>
        </div>
        <div class="user-info-grid">
            <div class="user-info-item">
                <div class="user-info-label">Age</div>
                <div class="user-info-value">${currentUser.age || 'Not specified'}</div>
            </div>
            <div class="user-info-item">
                <div class="user-info-label">Gender</div>
                <div class="user-info-value">${formatGender(currentUser.gender) || 'Not specified'}</div>
            </div>
            <div class="user-info-item">
                <div class="user-info-label">Blood Group</div>
                <div class="user-info-value">${currentUser.bloodGroup || 'Not specified'}</div>
            </div>
            <div class="user-info-item">
                <div class="user-info-label">Emergency Contact</div>
                <div class="user-info-value">${currentUser.emergencyContact || 'Not specified'}</div>
            </div>
            ${currentUser.medicalHistory ? `
            <div class="user-info-item full-width">
                <div class="user-info-label">Medical History</div>
                <div class="user-info-value medical-history">${currentUser.medicalHistory}</div>
            </div>
            ` : ''}
        </div>
    `;
    
    userInfoDiv.innerHTML = formattedUserInfo;
    
    // Add edit profile event listener
    const editProfileBtn = userInfoDiv.querySelector('.edit-profile-btn');
    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            showProfileEditor();
        });
    }
    
    // Show demo mode notification if applicable
    const demoUserName = localStorage.getItem('demoUserName');
    if (demoUserName) {
        showDemoNotification(demoUserName);
        // Start simulating vital signs for demo
        startDemoSimulation(demoUserName);
    }
    
    // Add CSS for user profile
    addCssToHead(`
        .user-profile {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--glass-border);
        }
        
        .user-avatar {
            position: relative;
            font-size: 3rem;
            color: rgba(255, 255, 255, 0.8);
            line-height: 1;
        }
        
        .user-status {
            position: absolute;
            bottom: 0.25rem;
            right: 0.25rem;
            width: 0.75rem;
            height: 0.75rem;
            border-radius: 50%;
            border: 2px solid var(--glass-bg);
        }
        
        .user-status.online {
            background-color: var(--success-color);
            box-shadow: 0 0 8px var(--success-color);
        }
        
        .user-status.away {
            background-color: var(--warning-color);
            box-shadow: 0 0 8px var(--warning-color);
        }
        
        .user-status.offline {
            background-color: rgba(255, 255, 255, 0.4);
        }
        
        .user-details h4 {
            font-size: 1.25rem;
            margin: 0;
            font-weight: 600;
            letter-spacing: -0.02em;
            font-family: 'Manrope', sans-serif;
        }
        
        .user-details p {
            opacity: 0.7;
            margin: 0.25rem 0 0;
        }
        
        .user-badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            font-size: 0.75rem;
            color: white;
            background-color: var(--primary-color);
            border-radius: 1rem;
            margin-top: 0.5rem;
            font-weight: 500;
        }
        
        .user-info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;
        }
        
        .user-info-item {
            display: flex;
            flex-direction: column;
            gap: 0.4rem;
        }
        
        .user-info-item.full-width {
            grid-column: 1 / -1;
        }
        
        .user-info-label {
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            opacity: 0.6;
        }
        
        .user-info-value {
            font-weight: 500;
        }
        
        .medical-history {
            line-height: 1.5;
            padding: 0.75rem;
            background: rgba(0, 0, 0, 0.1);
            border-radius: 0.5rem;
            font-size: 0.9rem;
        }
    `);
}

// Initialize WebSocket connection with reconnection logic
function initWebSocket() {
    if (typeof WebSocket === 'undefined') {
        console.log('WebSocket not supported in this browser');
        simulateRealTimeUpdates(); // Fallback to simulation
        return;
    }
    
    try {
        ws = new WebSocket('ws://localhost:8080');
        
        ws.onopen = function() {
            console.log('Connected to WebSocket server');
            showNotification('Connected to real-time updates', 'success');
            
            // Send auth message
            if (currentUser) {
                ws.send(JSON.stringify({
                    type: 'auth',
                    userId: currentUser.phone
                }));
            }
        };
        
        ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleRealTimeUpdate(data);
            } catch (e) {
                console.error('Error parsing WebSocket message:', e);
            }
        };
        
        ws.onclose = function() {
            console.log('WebSocket connection closed');
            // Reconnect after delay with exponential backoff
            setTimeout(() => {
                console.log('Attempting to reconnect...');
                initWebSocket();
            }, 5000);
            
            // Fallback to simulation while disconnected
            simulateRealTimeUpdates();
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
            simulateRealTimeUpdates(); // Fallback to simulation
        };
    } catch (error) {
        console.error('WebSocket connection error:', error);
        simulateRealTimeUpdates(); // Fallback to simulation
    }
}

// Handle real-time updates with enhanced UI feedback
function handleRealTimeUpdate(data) {
    if (!data || !data.type) return;
    
    // Process based on message type
    switch (data.type) {
        case 'health_data':
            if (data.data.userId === currentUser?.phone) {
                updateVitalSigns(data.data);
                updateHealthChart(data.data);
                updateLocation(data.data.location);
                checkWarningConditions(data.data);
            }
            break;
            
        case 'emergency':
            if (data.data.userId === currentUser?.phone) {
                showEmergencyAlert(data.data.reason);
                addEmergencyToHistory(data.data);
            }
            break;
            
        case 'system_notification':
            showNotification(data.data.message, data.data.level || 'info');
            break;
            
        default:
            console.log('Unknown message type:', data.type);
    }
}

// Update vital signs with enhanced animation and status indicators
function updateVitalSigns(data) {
    if (!data) return;
    
    // Store readings for trend analysis
    lastVitalReadings = {
        ...lastVitalReadings,
        ...data
    };
    
    // Update heart rate with status indicator
    if (data.heartRate) {
        const heartRateElement = document.getElementById('heartRate');
        if (heartRateElement) {
            const prevValue = parseInt(heartRateElement.textContent);
            const newValue = data.heartRate;
            
            // Add appropriate status class
            heartRateElement.className = 'vital-value';
            
            if (newValue < 60) {
                heartRateElement.classList.add('status-warning');
            } else if (newValue > 100) {
                heartRateElement.classList.add('status-danger');
            } else {
                heartRateElement.classList.add('status-normal');
            }
            
            // Animate value change
            animateNumber(heartRateElement, prevValue, newValue, ' BPM');
        }
    }
    
    // Update temperature with status indicator
    if (data.temperature) {
        const temperatureElement = document.getElementById('temperature');
        if (temperatureElement) {
            const prevValue = parseFloat(temperatureElement.textContent);
            const newValue = data.temperature;
            
            // Add appropriate status class
            temperatureElement.className = 'vital-value';
            
            if (newValue < 36.0) {
                temperatureElement.classList.add('status-warning');
            } else if (newValue > 37.5) {
                temperatureElement.classList.add('status-danger');
            } else {
                temperatureElement.classList.add('status-normal');
            }
            
            // Animate value change
            animateNumber(temperatureElement, prevValue, newValue, ' °C');
        }
    }
    
    // Update blood pressure with status indicator
    if (data.bloodPressure) {
        const bpElement = document.getElementById('bloodPressure');
        if (bpElement) {
            bpElement.textContent = data.bloodPressure;
            
            // Extract systolic from format like "120/80"
            const systolic = parseInt(data.bloodPressure.split('/')[0]);
            
            // Add appropriate status class
            bpElement.className = 'vital-value';
            
            if (systolic < 90) {
                bpElement.classList.add('status-warning');
            } else if (systolic > 140) {
                bpElement.classList.add('status-danger');
            } else {
                bpElement.classList.add('status-normal');
            }
        }
    }
    
    // Update timestamp
    if (data.timestamp) {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const timestamp = new Date(data.timestamp);
            lastUpdateElement.textContent = formatTimestamp(timestamp);
        }
    }
}

// Initialize map with modern styling
function initMap() {
    const mapContainer = document.getElementById('map');
    if (!mapContainer || typeof L === 'undefined') return;
    
    // Modern map style
    map = L.map('map', {
        zoomControl: false, // Custom position below
        attributionControl: false
    }).setView([0, 0], 2);
    
    L.control.zoom({
        position: 'bottomright'
    }).addTo(map);
    
    L.control.attribution({
        position: 'bottomleft',
        prefix: 'RescueNet AI'
    }).addTo(map);
    
    // Add custom styled map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Add custom marker icon
    const userIcon = L.divIcon({
        className: 'custom-map-marker',
        html: '<i class="fas fa-map-marker-alt"></i>',
        iconSize: [30, 42],
        iconAnchor: [15, 42]
    });
    
    userMarker = L.marker([0, 0], {
        icon: userIcon
    }).addTo(map);
    
    // Add pulse animation styles
    addCssToHead(`
        .custom-map-marker {
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        
        .custom-map-marker i {
            font-size: 2rem;
            color: #ef4444;
            text-shadow: 0 0 10px rgba(239, 68, 68, 0.6);
            animation: markerPulse 2s infinite;
            z-index: 1;
        }
        
        .custom-map-marker::after {
            content: '';
            position: absolute;
            width: 20px;
            height: 20px;
            border-radius: 50%;
            background: rgba(239, 68, 68, 0.3);
            animation: markerRipple 2s infinite;
        }
        
        @keyframes markerPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.1); }
        }
        
        @keyframes markerRipple {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(4); opacity: 0; }
        }
    `);
}

// Update user location on map with smooth animation
function updateLocation(location) {
    if (!location || !map || !userMarker) return;
    
    const { latitude, longitude } = location;
    
    if (!latitude || !longitude) return;
    
    // Update lat/long display
    document.getElementById('latitude')?.textContent = latitude.toFixed(6);
    document.getElementById('longitude')?.textContent = longitude.toFixed(6);
    
    // Update marker with smooth animation
    userMarker.setLatLng([latitude, longitude]);
    
    // Pan map to new position smoothly
    map.panTo([latitude, longitude], {
        animate: true,
        duration: 1.5
    });
    
    // Set appropriate zoom level
    if (map.getZoom() < 14) {
        map.setZoom(15);
    }
}

// Initialize health chart with modern styling
function initHealthChart() {
    const chartCanvas = document.getElementById('chartCanvas');
    if (!chartCanvas || typeof Chart === 'undefined') return;
    
    // Create gradient fill
    const ctx = chartCanvas.getContext('2d');
    const gradientFill = ctx.createLinearGradient(0, 0, 0, 300);
    gradientFill.addColorStop(0, 'rgba(58, 142, 230, 0.5)');
    gradientFill.addColorStop(1, 'rgba(58, 142, 230, 0.1)');
    
    const gradientFill2 = ctx.createLinearGradient(0, 0, 0, 300);
    gradientFill2.addColorStop(0, 'rgba(247, 37, 133, 0.5)');
    gradientFill2.addColorStop(1, 'rgba(247, 37, 133, 0.1)');
    
    // Generate initial empty chart data
    const initialLabels = [];
    const initialHeartRate = [];
    const initialTemperature = [];
    
    // Add some empty data points
    for (let i = 0; i < 10; i++) {
        const time = new Date();
        time.setMinutes(time.getMinutes() - (9 - i));
        initialLabels.push(formatTime(time));
        initialHeartRate.push(null);
        initialTemperature.push(null);
    }
    
    // Chart configuration
    healthChart = new Chart(chartCanvas, {
        type: 'line',
        data: {
            labels: initialLabels,
            datasets: [
                {
                    label: 'Heart Rate (BPM)',
                    data: initialHeartRate,
                    borderColor: 'rgb(58, 142, 230)',
                    backgroundColor: gradientFill,
                    borderWidth: 2,
                    pointBackgroundColor: 'white',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Temperature (°C)',
                    data: initialTemperature,
                    borderColor: 'rgb(247, 37, 133)',
                    backgroundColor: gradientFill2,
                    borderWidth: 2,
                    pointBackgroundColor: 'white',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1000,
                easing: 'easeOutQuart'
            },
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        color: 'rgba(255, 255, 255, 0.8)',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: 'rgba(255, 255, 255, 0.9)',
                    bodyColor: 'rgba(255, 255, 255, 0.8)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 1,
                    cornerRadius: 8,
                    padding: 12,
                    boxPadding: 6,
                    usePointStyle: true,
                    titleFont: {
                        family: "'Poppins', sans-serif",
                        size: 14,
                        weight: 600
                    },
                    bodyFont: {
                        family: "'Poppins', sans-serif",
                        size: 13
                    }
                }
            },
            scales: {
                x: {
                    border: {
                        display: false
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 11
                        }
                    }
                },
                y: {
                    min: 40,
                    max: 180,
                    border: {
                        display: false
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 11
                        }
                    }
                },
                y1: {
                    position: 'right',
                    min: 35,
                    max: 40,
                    border: {
                        display: false
                    },
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.6)',
                        font: {
                            family: "'Poppins', sans-serif",
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

// Update health chart with new data
function updateHealthChart(data) {
    if (!healthChart || !data) return;
    
    const now = new Date();
    const formattedTime = formatTime(now);
    
    // Add new data points
    healthChart.data.labels.push(formattedTime);
    healthChart.data.datasets[0].data.push(data.heartRate || null);
    healthChart.data.datasets[1].data.push(data.temperature || null);
    
    // Remove oldest data point if we have more than 10
    if (healthChart.data.labels.length > 10) {
        healthChart.data.labels.shift();
        healthChart.data.datasets[0].data.shift();
        healthChart.data.datasets[1].data.shift();
    }
    
    // Update chart with animation
    healthChart.update();
}

// Show emergency alert with enhanced UI and animation
function showEmergencyAlert(reason) {
    const alert = document.getElementById('emergencyAlert');
    if (!alert) return;
    
    // Set alert content
    alert.querySelector('#emergencyMessage').textContent = reason || 'EMERGENCY DETECTED!';
    
    // Play alert sound if available
    playAlertSound();
    
    // Show alert with animation
    alert.classList.remove('hidden');
    alert.style.animation = 'none'; // Reset animation
    setTimeout(() => {
        alert.style.animation = 'pulseAlert 1.5s infinite';
    }, 10);
    
    // Set emergency status
    emergencyStatus = true;
    
    // Log emergency
    addEmergencyToHistory({
        reason: reason || 'Unknown emergency',
        timestamp: new Date()
    });
    
    // Automatically dismiss after 30 seconds
    if (emergencyTimeout) clearTimeout(emergencyTimeout);
    emergencyTimeout = setTimeout(dismissEmergencyAlert, 30000);
    
    // Show notification
    showNotification('Emergency alert activated', 'error');
}

// Dismiss emergency alert
function dismissEmergencyAlert() {
    const alert = document.getElementById('emergencyAlert');
    if (!alert || !emergencyStatus) return;
    
    // Create dismissal confirmation modal
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container emergency-dismiss-modal';
    
    modalContainer.innerHTML = `
        <div class="modal-backdrop"></div>
        <div class="modal-content emergency-modal">
            <div class="modal-header emergency-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Confirm Dismissal</h3>
                <button class="modal-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Are you sure you want to dismiss this emergency alert?</p>
                <p class="emergency-warning">This action will cancel any ongoing emergency response.</p>
                <div class="form-actions">
                    <button class="btn btn-outlined" id="cancelDismiss">Cancel</button>
                    <button class="btn btn-danger" id="confirmDismiss">
                        <i class="fas fa-check"></i> Confirm Dismissal
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Show the modal with animation
    setTimeout(() => {
        modalContainer.classList.add('show');
    }, 10);
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.modal-close');
    const cancelBtn = modalContainer.querySelector('#cancelDismiss');
    const confirmBtn = modalContainer.querySelector('#confirmDismiss');
    const backdrop = modalContainer.querySelector('.modal-backdrop');
    
    // Close modal function
    const closeModal = () => {
        modalContainer.classList.remove('show');
        setTimeout(() => {
            modalContainer.remove();
        }, 300); // Match the CSS transition duration
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    // Confirm dismissal
    confirmBtn.addEventListener('click', () => {
        // Hide alert with enhanced animation
        alert.classList.add('dismissing');
        setTimeout(() => {
            alert.classList.add('hidden');
        }, 800);
        
        // Reset emergency status
        emergencyStatus = false;
        
        // Clear timeout
        if (emergencyTimeout) {
            clearTimeout(emergencyTimeout);
            emergencyTimeout = null;
        }
        
        // Show notification
        showNotification('Emergency alert has been dismissed', 'success');
        
        // Add to emergency history
        addToEmergencyHistory({
            type: 'dismissal',
            reason: 'Manually dismissed by user',
            timestamp: new Date()
        });
        
        closeModal();
    });
}

// Trigger emergency manually with improved UX
function triggerEmergency() {
    if (emergencyStatus) {
        // If emergency is already active, dismiss it
        dismissEmergencyAlert();
        return;
    }
    
    // Create confirmation modal with enhanced UI
    const modalContainer = document.createElement('div');
    modalContainer.className = 'modal-container emergency-trigger-modal';
    
    modalContainer.innerHTML = `
        <div class="modal-backdrop emergency-backdrop"></div>
        <div class="modal-content emergency-modal">
            <div class="modal-header emergency-header">
                <h3><i class="fas fa-exclamation-triangle"></i> Trigger Emergency</h3>
                <button class="modal-close" aria-label="Close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <p class="emergency-confirm-text">Are you sure you want to trigger an emergency alert?</p>
                <p class="emergency-warning">This will notify emergency services of your situation and location.</p>
                <div class="form-group">
                    <label for="emergencyReason">Reason (Optional)</label>
                    <select id="emergencyReason" class="emergency-reason-select">
                        <option value="Medical Emergency">Medical Emergency</option>
                        <option value="Accident">Accident</option>
                        <option value="Safety Concern">Safety Concern</option>
                        <option value="Other">Other</option>
                    </select>
                </div>
                <div class="form-group emergency-notes-container hidden">
                    <label for="emergencyNotes">Additional Notes</label>
                    <textarea id="emergencyNotes" placeholder="Provide any details that might help emergency responders"></textarea>
                </div>
                <div class="form-actions emergency-actions">
                    <button class="btn btn-outlined" id="cancelEmergency">Cancel</button>
                    <button class="btn btn-danger pulse-btn" id="confirmEmergency">
                        <i class="fas fa-exclamation-circle"></i> Trigger Emergency
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalContainer);
    
    // Show the modal with animation
    setTimeout(() => {
        modalContainer.classList.add('show');
    }, 10);
    
    // Add event listeners
    const closeBtn = modalContainer.querySelector('.modal-close');
    const cancelBtn = modalContainer.querySelector('#cancelEmergency');
    const confirmBtn = modalContainer.querySelector('#confirmEmergency');
    const backdrop = modalContainer.querySelector('.modal-backdrop');
    const reasonSelect = modalContainer.querySelector('#emergencyReason');
    const notesContainer = modalContainer.querySelector('.emergency-notes-container');
    
    reasonSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Other') {
            notesContainer.classList.remove('hidden');
        } else {
            notesContainer.classList.add('hidden');
        }
    });
    
    // Close modal function
    const closeModal = () => {
        modalContainer.classList.remove('show');
        setTimeout(() => {
            modalContainer.remove();
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    backdrop.addEventListener('click', closeModal);
    
    // Confirm emergency trigger
    confirmBtn.addEventListener('click', () => {
        const reason = reasonSelect.value;
        const notes = modalContainer.querySelector('#emergencyNotes')?.value || '';
        const emergencyReason = reason === 'Other' && notes ? notes : reason;
        
        showEmergencyAlert(`${reason}${notes ? ': ' + notes : ''}`);
        
        // Send emergency signal via WebSocket if connected
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'emergency',
                data: {
                    userId: currentUser?.phone,
                    reason: emergencyReason,
                    timestamp: new Date()
                }
            }));
        }
    }
}

// Load emergency history
function loadEmergencyHistory() {
    const historyDiv = document.getElementById('emergencyHistory');
    if (!historyDiv) return;
    
    // Try to load from localStorage
    const history = JSON.parse(localStorage.getItem('emergencyHistory') || '[]');
    
    if (history.length === 0) {
        historyDiv.innerHTML = '<p class="empty-state">No emergency history available</p>';
        
        // Add empty state styling
        addCssToHead(`
            .empty-state {
                text-align: center;
                color: var(--text-muted);
                padding: 2rem 0;
                font-style: italic;
            }
        `);
        
        return;
    }
    
    // Sort history by timestamp (newest first)
    history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    // Generate HTML for each entry
    const historyHTML = history.map(entry => `
        <div class="emergency-entry">
            <div class="emergency-entry-header">
                <div class="emergency-entry-type">${entry.reason || 'Unknown emergency'}</div>
                <div class="emergency-entry-date">${formatDateTime(new Date(entry.timestamp))}</div>
            </div>
            ${entry.location ? `
            <div class="emergency-entry-location">
                <i class="fas fa-map-marker-alt"></i>
                ${entry.location.latitude.toFixed(6)}, ${entry.location.longitude.toFixed(6)}
            </div>
            ` : ''}
        </div>
    `).join('');
    
    historyDiv.innerHTML = historyHTML;
}

// Add new emergency to history
function addEmergencyToHistory(data) {
    if (!data) return;
    
    // Load existing history
    const history = JSON.parse(localStorage.getItem('emergencyHistory') || '[]');
    
    // Add new entry
    history.push({
        reason: data.reason || 'Unknown emergency',
        timestamp: data.timestamp || new Date(),
        location: data.location || lastVitalReadings?.location
    });
    
    // Keep only the latest 10 entries
    while (history.length > 10) history.shift();
    
    // Save back to localStorage
    localStorage.setItem('emergencyHistory', JSON.stringify(history));
    
    // Reload history display
    loadEmergencyHistory();
}

// Load health statistics
function loadHealthStats() {
    const statsDiv = document.getElementById('healthStats');
    if (!statsDiv) return;
    
    // Demo stats
    const statsData = [
        { icon: 'heartbeat', value: '72', label: 'Average BPM today' },
        { icon: 'thermometer-half', value: '36.8°C', label: 'Average Temperature' },
        { icon: 'walking', value: '5.3K', label: 'Steps today' },
        { icon: 'bed', value: '7h 20m', label: 'Sleep last night' }
    ];
    
    // Generate HTML
    const statsHTML = statsData.map(stat => `
        <div class="stat-box">
            <div class="stat-icon">
                <i class="fas fa-${stat.icon}"></i>
            </div>
            <div class="stat-text">
                <div class="stat-value">${stat.value}</div>
                <div class="stat-label">${stat.label}</div>
            </div>
        </div>
    `).join('');
    
    statsDiv.innerHTML = statsHTML;
}

// Show demo notification with enhanced styling
function showDemoNotification(userName) {
    const notification = document.createElement('div');
    notification.className = 'notification info';
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <i class="fas fa-info-circle" style="font-size: 1.25rem;"></i>
            <div>
                <strong style="display: block; margin-bottom: 4px;">Demo Mode Active</strong>
                <span style="font-size: 0.875rem; opacity: 0.9;">Logged in as ${userName}. Displaying simulated health data.</span>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Start demo simulation based on user profile
function startDemoSimulation(userName) {
    let hasCondition = false;
    let condition = '';
    
    // Extract condition from demo username
    if (userName.includes('Healthy')) {
        condition = 'healthy';
    } else if (userName.includes('Diabetic')) {
        condition = 'diabetic';
        hasCondition = true;
    } else if (userName.includes('Heart')) {
        condition = 'heart';
        hasCondition = true;
    } else if (userName.includes('Asthma')) {
        condition = 'asthma';
        hasCondition = true;
    } else if (userName.includes('Elderly')) {
        condition = 'elderly';
        hasCondition = true;
    }
    
    console.log(`Starting demo simulation for ${condition} user profile`);
    
    // Initial data based on condition
    let heartRate, temperature, bloodPressure;
    
    switch (condition) {
        case 'diabetic':
            heartRate = randomRange(75, 85);
            temperature = randomRange(36.6, 37.1);
            bloodPressure = `${randomRange(130, 140)}/${randomRange(80, 90)}`;
            break;
        case 'heart':
            heartRate = randomRange(90, 100);
            temperature = randomRange(36.8, 37.2);
            bloodPressure = `${randomRange(140, 160)}/${randomRange(85, 95)}`;
            break;
        case 'asthma':
            heartRate = randomRange(80, 90);
            temperature = randomRange(36.7, 37.0);
            bloodPressure = `${randomRange(125, 135)}/${randomRange(75, 85)}`;
            break;
        case 'elderly':
            heartRate = randomRange(70, 80);
            temperature = randomRange(36.3, 36.7);
            bloodPressure = `${randomRange(135, 150)}/${randomRange(70, 80)}`;
            break;
        default: // healthy
            heartRate = randomRange(65, 75);
            temperature = randomRange(36.5, 36.9);
            bloodPressure = `${randomRange(115, 125)}/${randomRange(70, 80)}`;
    }
    
    // Set initial data
    updateVitalSigns({
        heartRate,
        temperature,
        bloodPressure,
        timestamp: new Date()
    });
    
    // Set mock location - using random coordinates near London
    const location = {
        latitude: 51.5074 + ((Math.random() - 0.5) * 0.02),
        longitude: -0.1278 + ((Math.random() - 0.5) * 0.02)
    };
    
    updateLocation(location);
    
    // Update chart with initial data
    updateHealthChart({
        heartRate,
        temperature
    });
    
    // Setup periodic updates with variation based on condition
    let emergencyChance = 0;
    
    switch (condition) {
        case 'diabetic':
            emergencyChance = 0.05; // 5% chance per update
            break;
        case 'heart':
            emergencyChance = 0.1; // 10% chance per update
            break;
        case 'asthma':
            emergencyChance = 0.07; // 7% chance per update
            break;
        case 'elderly':
            emergencyChance = 0.08; // 8% chance per update
            break;
        default:
            emergencyChance = 0.02; // 2% chance for healthy
    }
    
    // Setup interval for periodic updates
    const updateInterval = setInterval(() => {
        // Check if user is still logged in
        if (!localStorage.getItem('currentUser')) {
            clearInterval(updateInterval);
            return;
        }
        
        // Random variation for vital signs
        let newHeartRate, newTemperature, newBloodPressure;
        
        switch (condition) {
            case 'diabetic':
                newHeartRate = randomRange(70, 90) + (Math.random() > 0.8 ? 15 : 0);
                newTemperature = randomRange(36.4, 37.3) + (Math.random() > 0.9 ? 0.5 : 0);
                newBloodPressure = `${randomRange(125, 145)}/${randomRange(75, 95)}`;
                break;
            case 'heart':
                newHeartRate = randomRange(85, 105) + (Math.random() > 0.7 ? 20 : 0);
                newTemperature = randomRange(36.7, 37.4);
                newBloodPressure = `${randomRange(135, 165)}/${randomRange(80, 100)}`;
                break;
            case 'asthma':
                newHeartRate = randomRange(75, 95) + (Math.random() > 0.85 ? 15 : 0);
                newTemperature = randomRange(36.6, 37.2);
                newBloodPressure = `${randomRange(120, 140)}/${randomRange(70, 90)}`;
                break;
            case 'elderly':
                newHeartRate = randomRange(65, 85) + (Math.random() > 0.9 ? 15 : 0);
                newTemperature = randomRange(36.2, 36.8) + (Math.random() > 0.95 ? -0.5 : 0);
                newBloodPressure = `${randomRange(130, 155)}/${randomRange(65, 85)}`;
                break;
            default: // healthy
                newHeartRate = randomRange(60, 80);
                newTemperature = randomRange(36.4, 37.0);
                newBloodPressure = `${randomRange(110, 130)}/${randomRange(65, 85)}`;
        }
        
        // Simulate small movement
        const newLocation = {
            latitude: location.latitude + ((Math.random() - 0.5) * 0.001),
            longitude: location.longitude + ((Math.random() - 0.5) * 0.001)
        };
        
        // Update UI
        updateVitalSigns({
            heartRate: newHeartRate,
            temperature: newTemperature,
            bloodPressure: newBloodPressure,
            timestamp: new Date()
        });
        
        updateLocation(newLocation);
        
        updateHealthChart({
            heartRate: newHeartRate,
            temperature: newTemperature
        });
        
        // Check if we should trigger an emergency
        if (Math.random() < emergencyChance && !emergencyStatus) {
            let emergencyReason = '';
            
            switch (condition) {
                case 'diabetic':
                    emergencyReason = Math.random() > 0.5 ? 
                        'High blood glucose detected' : 
                        'Low blood glucose detected';
                    break;
                case 'heart':
                    emergencyReason = Math.random() > 0.5 ?
                        'Irregular heartbeat detected' :
                        'Elevated heart rate detected';
                    break;
                case 'asthma':
                    emergencyReason = 'Respiratory distress detected';
                    break;
                case 'elderly':
                    emergencyReason = Math.random() > 0.5 ?
                        'Fall detected' :
                        'Unusual vital sign pattern';
                    break;
                default:
                    emergencyReason = 'Unusual vital sign change detected';
            }
            
            showEmergencyAlert(emergencyReason);
        }
    }, 5000); // Update every 5 seconds
}

// Check for warning conditions and show notifications
function checkWarningConditions(data) {
    if (!data) return;
    
    // Heart rate warnings
    if (data.heartRate > 120) {
        showNotification('Warning: Very high heart rate detected', 'error');
    } else if (data.heartRate > 100) {
        showNotification('Notice: Elevated heart rate detected', 'warning');
    } else if (data.heartRate < 50) {
        showNotification('Warning: Very low heart rate detected', 'error');
    }
    
    // Temperature warnings
    if (data.temperature > 38) {
        showNotification('Warning: Fever detected', 'error');
    } else if (data.temperature > 37.5) {
        showNotification('Notice: Elevated temperature detected', 'warning');
    } else if (data.temperature < 35.5) {
        showNotification('Warning: Low body temperature detected', 'error');
    }
    
    // Blood pressure warnings
    if (data.bloodPressure) {
        const systolic = parseInt(data.bloodPressure.split('/')[0]);
        
        if (systolic > 160) {
            showNotification('Warning: Very high blood pressure detected', 'error');
        } else if (systolic > 140) {
            showNotification('Notice: Elevated blood pressure detected', 'warning');
        } else if (systolic < 90) {
            showNotification('Warning: Low blood pressure detected', 'error');
        }
    }
}

// Play alert sound
function playAlertSound() {
    const audio = new Audio();
    audio.src = 'data:audio/mp3;base64,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