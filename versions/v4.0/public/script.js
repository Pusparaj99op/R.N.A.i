// Global variables
let socket;
let currentUser = null;
let vitalChart = null;
let map = null;
let userMarker = null;

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    initializeSocketConnection();
    setupEventListeners();
    
    // Show gender-specific fields
    document.getElementById('regGender').addEventListener('change', function() {
        const femaleFields = document.getElementById('femaleFields');
        if (this.value === 'Female') {
            femaleFields.style.display = 'block';
        } else {
            femaleFields.style.display = 'none';
        }
    });
});

function initializeSocketConnection() {
    socket = io();
    
    socket.on('connect', function() {
        updateConnectionStatus(true);
    });
    
    socket.on('disconnect', function() {
        updateConnectionStatus(false);
    });
    
    socket.on('healthUpdate', function(data) {
        if (currentUser && data.userId === currentUser.phone) {
            updateVitalSigns(data);
            updateChart();
            updateMap(data.location);
        }
    });
    
    socket.on('emergencyAlert', function(emergency) {
        if (currentUser && emergency.userId === currentUser.phone) {
            showEmergencyAlert(emergency);
        }
    });
    
    socket.on('userInactive', function(data) {
        if (currentUser && data.userId === currentUser.phone) {
            showInactiveWarning(data.lastSeen);
        }
    });
}

function setupEventListeners() {
    // Login form
    document.getElementById('userLoginForm').addEventListener('submit', handleLogin);
    
    // Registration form
    document.getElementById('userRegistrationForm').addEventListener('submit', handleRegistration);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const phone = document.getElementById('phoneNumber').value;
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ phone })
        });
        
        const result = await response.json();
        
        if (result.success) {
            currentUser = result.user;
            showDashboard();
            loadDashboardData();
            socket.emit('joinRoom', currentUser.phone);
        } else {
            alert('Login failed: ' + result.message);
        }
    } catch (error) {
        alert('Login error: ' + error.message);
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    
    const userData = {
        name: document.getElementById('regName').value,
        phone: document.getElementById('regPhone').value,
        age: parseInt(document.getElementById('regAge').value),
        gender: document.getElementById('regGender').value,
        bloodType: document.getElementById('regBloodType').value,
        emergencyContacts: [{
            name: document.getElementById('regEmergencyName').value,
            phone: document.getElementById('regEmergencyPhone').value,
            relationship: 'Emergency Contact'
        }],
        medicalHistory: document.getElementById('regMedicalHistory').value,
        lastPeriodDate: document.getElementById('regLastPeriod').value || null
    };
    
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Registration successful! Please login now.');
            showLoginForm();
        } else {
            alert('Registration failed: ' + result.message);
        }
    } catch (error) {
        alert('Registration error: ' + error.message);
    }
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'none';
}

function showRegistrationForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'block';
    document.getElementById('dashboard').style.display = 'none';
}

function showDashboard() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registrationForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    
    // Update user info
    document.getElementById('userName').textContent = `Welcome, ${currentUser.name}`;
    document.getElementById('userDetails').textContent = 
        `Age: ${currentUser.age} | Gender: ${currentUser.gender} | Blood Type: ${currentUser.bloodType || 'N/A'}`;
    
    initializeChart();
    initializeMap();
}

async function loadDashboardData() {
    try {
        const response = await fetch(`/api/dashboard/${currentUser._id}`);
        const result = await response.json();
        
        if (result.success) {
            updateEmergencyLog(result.data.emergencies);
            if (result.data.healthData.length > 0) {
                const latestData = result.data.healthData[0];
                updateVitalSigns(latestData);
                updateMap(latestData.location);
            }
        }
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

function updateVitalSigns(data) {
    // Heart Rate
    document.getElementById('heartRate').textContent = data.heartRate || '--';
    updateVitalStatus('heartRateStatus', data.heartRate, 60, 100, 'BPM');
    
    // Temperature
    document.getElementById('temperature').textContent = data.temperature ? data.temperature.toFixed(1) : '--';
    updateVitalStatus('temperatureStatus', data.temperature, 36.5, 37.5, '°C');
    // Blood Pressure
    document.getElementById('bloodPressure').textContent = data.bloodPressure || '--';
    updateVitalStatus('bloodPressureStatus', data.bloodPressure, 90, 120, 'mmHg');
    // Oxygen Saturation
    document.getElementById('oxygenSaturation').textContent = data.oxygenSaturation || '--';
    updateVitalStatus('oxygenSaturationStatus', data.oxygenSaturation, 95, 100, '%');
    
    // Update timestamp
    document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString();
}

function updateVitalStatus(elementId, value, minNormal, maxNormal, unit) {
    const element = document.getElementById(elementId);
    if (!element || !value) return;
    
    if (value < minNormal || value > maxNormal) {
        element.className = 'badge bg-warning';
        element.textContent = 'Warning';
    } else {
        element.className = 'badge bg-success';
        element.textContent = 'Normal';
    }
}

function initializeChart() {
    const ctx = document.getElementById('vitalChart').getContext('2d');
    vitalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Heart Rate',
                data: [],
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1
            }, {
                label: 'Temperature',
                data: [],
                borderColor: 'rgb(54, 162, 235)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                tension: 0.1,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            plugins: {
                title: {
                    display: true,
                    text: 'Real-time Vital Signs'
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Heart Rate (BPM)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Temperature (°C)'
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

function updateChart(timeRange = '1h') {
    if (!vitalChart) return;
    
    // Generate mock data for demonstration
    const now = new Date();
    const labels = [];
    const heartRateData = [];
    const temperatureData = [];
    
    let points = 10;
    let interval = 60000; // 1 minute
    
    switch(timeRange) {
        case '1h':
            points = 60;
            interval = 60000; // 1 minute
            break;
        case '24h':
            points = 24;
            interval = 3600000; // 1 hour
            break;
        case '7d':
            points = 7;
            interval = 86400000; // 1 day
            break;
    }
    
    for (let i = points - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * interval));
        labels.push(time.toLocaleTimeString());
        
        // Generate realistic mock data
        heartRateData.push(Math.floor(Math.random() * 20) + 70); // 70-90 BPM
        temperatureData.push(Math.random() * 2 + 36.5); // 36.5-38.5°C
    }
    
    vitalChart.data.labels = labels;
    vitalChart.data.datasets[0].data = heartRateData;
    vitalChart.data.datasets[1].data = temperatureData;
    vitalChart.update();
}

function initializeMap() {
    if (typeof google === 'undefined') {
        console.warn('Google Maps API not loaded');
        return;
    }
    
    const mapOptions = {
        zoom: 15,
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    
    map = new google.maps.Map(document.getElementById('map'), mapOptions);
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const userLocation = {
                lat: position.coords.latitude,
                lng: position.coords.longitude
            };
            
            map.setCenter(userLocation);
            updateMap(userLocation);
        });
    }
}

function updateMap(location) {
    if (!map || !location) return;
    
    const position = { lat: location.lat || location.latitude, lng: location.lng || location.longitude };
    
    // Remove existing marker
    if (userMarker) {
        userMarker.setMap(null);
    }
    
    // Add new marker
    userMarker = new google.maps.Marker({
        position: position,
        map: map,
        title: 'Your Location',
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30)
        }
    });
    
    // Center map on user location
    map.setCenter(position);
}

function showEmergencyAlert(emergency) {
    const banner = document.getElementById('emergencyBanner');
    const message = document.getElementById('emergencyMessage');
    
    message.innerHTML = `
        <strong>${emergency.type}</strong> - ${emergency.message}<br>
        <small>Triggered at: ${new Date(emergency.timestamp).toLocaleString()}</small>
    `;
    
    banner.style.display = 'block';
    
    // Play alert sound if available
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance('Emergency alert activated');
        speechSynthesis.speak(utterance);
    }
}

function cancelEmergency() {
    const banner = document.getElementById('emergencyBanner');
    banner.style.display = 'none';
    
    // Notify server about emergency cancellation
    if (socket && currentUser) {
        socket.emit('cancelEmergency', { userId: currentUser.phone });
    }
}

function triggerTestEmergency() {
    if (!currentUser) return;
    
    const confirmation = confirm('This will trigger a test emergency alert. Are you sure?');
    if (!confirmation) return;
    
    socket.emit('triggerEmergency', {
        userId: currentUser.phone,
        type: 'Test',
        message: 'This is a test emergency alert',
        location: getCurrentLocation()
    });
}

function getCurrentLocation() {
    return new Promise((resolve, reject) => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    reject(error);
                }
            );
        } else {
            reject(new Error('Geolocation is not supported'));
        }
    });
}

function showInactiveWarning(lastSeen) {
    const warningHtml = `
        <div class="alert alert-warning alert-dismissible fade show mt-3" role="alert">
            <i class="fas fa-exclamation-triangle me-2"></i>
            <strong>Inactive User Alert:</strong> No activity detected since ${new Date(lastSeen).toLocaleString()}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    const dashboard = document.getElementById('dashboard');
    dashboard.insertAdjacentHTML('afterbegin', warningHtml);
}

function updateEmergencyLog(emergencies) {
    const tableBody = document.getElementById('emergencyTableBody');
    
    if (!emergencies || emergencies.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No emergency records</td></tr>';
        return;
    }
    
    tableBody.innerHTML = emergencies.map(emergency => `
        <tr>
            <td>${new Date(emergency.timestamp).toLocaleString()}</td>
            <td><span class="badge bg-${getEmergencyBadgeColor(emergency.type)}">${emergency.type}</span></td>
            <td>${emergency.message}</td>
            <td><span class="badge bg-${getStatusBadgeColor(emergency.status)}">${emergency.status}</span></td>
            <td>${emergency.responseTime ? formatResponseTime(emergency.responseTime) : 'N/A'}</td>
        </tr>
    `).join('');
}

function getEmergencyBadgeColor(type) {
    switch(type.toLowerCase()) {
        case 'critical': return 'danger';
        case 'warning': return 'warning';
        case 'test': return 'info';
        default: return 'secondary';
    }
}

function getStatusBadgeColor(status) {
    switch(status.toLowerCase()) {
        case 'resolved': return 'success';
        case 'active': return 'danger';
        case 'pending': return 'warning';
        default: return 'secondary';
    }
}

function formatResponseTime(milliseconds) {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
}

function updateConnectionStatus(isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (isConnected) {
        statusElement.innerHTML = '<i class="fas fa-circle status-online"></i> Connected';
    } else {
        statusElement.innerHTML = '<i class="fas fa-circle status-offline"></i> Disconnected';
    }
}

// Utility functions
function logout() {
    currentUser = null;
    showLoginForm();
    if (socket) {
        socket.disconnect();
    }
}

function refreshDashboard() {
    if (currentUser) {
        loadDashboardData();
    }
}

// Auto-refresh dashboard data every 30 seconds
setInterval(() => {
    if (currentUser) {
        refreshDashboard();
    }
}, 30000);

// Handle visibility change to pause/resume updates
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        // Pause updates when tab is not visible
        console.log('Tab hidden, pausing updates');
    } else {
        // Resume updates when tab becomes visible
        console.log('Tab visible, resuming updates');
        if (currentUser) {
            refreshDashboard();
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl+E for emergency
    if (e.ctrlKey && e.key === 'e') {
        e.preventDefault();
        triggerTestEmergency();
    }
    
    // Ctrl+R for refresh
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        refreshDashboard();
    }
});

// Initialize notification permission
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Show browser notification for emergencies
function showNotification(title, message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: message,
            icon: '/favicon.ico',
            badge: '/favicon.ico'
        });
    }
}

// Handle page unload
window.addEventListener('beforeunload', function() {
    if (socket) {
        socket.disconnect();
    }
});

// Export functions for testing (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        updateVitalSigns,
        updateChart,
        updateMap,
        showEmergencyAlert,
        cancelEmergency,
        triggerTestEmergency,
        updateEmergencyLog
    };
}
