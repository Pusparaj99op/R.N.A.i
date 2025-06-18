require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const WebSocket = require('ws');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const EmergencyServices = require('./utils/emergencyServices');
const HealthAnalytics = require('./utils/healthAnalytics');

const app = express();
const PORT = process.env.PORT || 3000;
const WEBSOCKET_PORT = process.env.WEBSOCKET_PORT || 8080;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static('public'));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rescuenet';
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// Initialize email transporter
let emailTransporter = null;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransporter({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

// User Schema
const userSchema = new mongoose.Schema({
  phone: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['M', 'F', 'Other'], required: true },
  bloodGroup: String,
  emergencyContact: String,
  medicalHistory: String,
  lastPeriodDate: Date,
  createdAt: { type: Date, default: Date.now }
});

// Health Data Schema (continued)
const healthDataSchema = new mongoose.Schema({
 userId: { type: String, required: true },
 timestamp: { type: Date, default: Date.now },
 vitals: {
   heartRate: Number,
   temperature: Number,
   bloodPressure: Number
 },
 location: {
   lat: Number,
   lng: Number,
   altitude: Number
 },
 accelerometer: {
   x: Number,
   y: Number,
   z: Number
 },
 emergency: { type: Boolean, default: false },
 emergencyReason: String
});

// Emergency Log Schema
const emergencySchema = new mongoose.Schema({
  userId: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  reason: String,
  location: {
    lat: Number,
    lng: Number
  },
  vitals: {
    heartRate: Number,
    temperature: Number,
    bloodPressure: Number
  },
  status: { type: String, enum: ['Active', 'Responded', 'Resolved'], default: 'Active' },
  autoDetected: { type: Boolean, default: false },
  resolved: { type: Boolean, default: false },
  responders: [{
    name: String,
    phone: String,
    eta: String,
    arrived: { type: Boolean, default: false }
  }],
  userInfo: {
    name: String,
    age: Number,
    bloodGroup: String,
    medicalHistory: String,
    emergencyContact: String
  }
});

const User = mongoose.model('User', userSchema);
const HealthData = mongoose.model('HealthData', healthDataSchema);
const Emergency = mongoose.model('Emergency', emergencySchema);

// WebSocket server for real-time updates
const wss = new WebSocket.Server({ port: WEBSOCKET_PORT });

wss.on('connection', function connection(ws) {
  console.log('Client connected to WebSocket');
  
  ws.on('message', function incoming(message) {
    try {
      const data = JSON.parse(message);
      console.log('Received WebSocket message:', data);
      
      // Handle different message types
      if (data.type === 'subscribe') {
        ws.userId = data.userId;
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  ws.on('close', function() {
    console.log('Client disconnected from WebSocket');
  });
});

// Broadcast function for real-time updates
function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
}

// Send message to specific user
function sendToUser(userId, data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN && client.userId === userId) {
      client.send(JSON.stringify(data));
    }
  });
}

// Emergency notification functions
async function sendSMSAlert(phoneNumber, message) {
  if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
    try {
      await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });
      console.log(`SMS sent to ${phoneNumber}`);
    } catch (error) {
      console.error('Error sending SMS:', error);
    }
  }
}

async function sendEmailAlert(email, subject, message) {
  if (emailTransporter) {
    try {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_FROM || 'RescueNet AI <noreply@rescuenet.ai>',
        to: email,
        subject: subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #e74c3c;">🚨 RescueNet AI Emergency Alert</h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
              ${message}
            </div>
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              This is an automated emergency notification from RescueNet AI.
            </p>
          </div>
        `
      });
      console.log(`Email sent to ${email}`);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }
}

// Routes

// User registration/login
app.post('/api/register', async (req, res) => {
 try {
   const { phone, name, age, gender, bloodGroup, emergencyContact, medicalHistory, lastPeriodDate } = req.body;
   
   const user = new User({
     phone,
     name,
     age,
     gender,
     bloodGroup,
     emergencyContact,
     medicalHistory,
     lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null
   });
   
   await user.save();
   res.json({ success: true, message: 'User registered successfully', user });
 } catch (error) {
   if (error.code === 11000) {
     res.status(400).json({ success: false, message: 'Phone number already registered' });
   } else {
     res.status(500).json({ success: false, message: error.message });
   }
 }
});

app.get('/api/user/:phone', async (req, res) => {
 try {
   const user = await User.findOne({ phone: req.params.phone });
   if (!user) {
     return res.status(404).json({ success: false, message: 'User not found' });
   }
   res.json({ success: true, user });
 } catch (error) {
   res.status(500).json({ success: false, message: error.message });
 }
});

// Health data endpoint with anomaly detection
app.post('/api/health-data', async (req, res) => {
  try {
    const healthData = new HealthData(req.body);
    await healthData.save();
      // Check for anomalies and trigger emergency if needed
    const anomalies = detectHealthAnomalies(healthData);
    if (anomalies.length > 0) {
      const user = await User.findOne({ phone: healthData.userId });
      if (user) {
        const emergency = new Emergency({
          userId: healthData.userId,
          reason: `Health anomaly detected: ${anomalies.join(', ')}`,
          location: healthData.location,
          vitals: healthData.vitals,
          autoDetected: true
        });
        
        await emergency.save();
        
        // Send emergency notifications (including SMS)
        await handleEmergencyNotifications(user, emergency);
        
        // Send emergency SMS if enabled
        if (user.emergencyContact) {
          await EmergencyServices.sendEmergencySMS(
            user.emergencyContact,
            emergency,
            user
          );
        }
        
        // Broadcast emergency alert
        broadcast({
          type: 'emergency',
          data: emergency
        });
      }
    }
    
    // Broadcast real-time data
    broadcast({
      type: 'health_data',
      data: healthData
    });
    
    res.json({ success: true, message: 'Health data saved successfully', anomalies });
  } catch (error) {
    console.error('Health data error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Function to detect health anomalies
function detectHealthAnomalies(healthData) {
  const anomalies = [];
  const vitals = healthData.vitals;
  
  if (vitals.heartRate) {
    if (vitals.heartRate > 120 || vitals.heartRate < 50) {
      anomalies.push(`Abnormal heart rate: ${vitals.heartRate} BPM`);
    }
  }
  
  if (vitals.temperature) {
    if (vitals.temperature > 38.5 || vitals.temperature < 35.0) {
      anomalies.push(`Abnormal temperature: ${vitals.temperature}°C`);
    }
  }
  
  if (vitals.bloodPressure) {
    if (vitals.bloodPressure > 180 || vitals.bloodPressure < 70) {
      anomalies.push(`Abnormal blood pressure: ${vitals.bloodPressure} mmHg`);
    }
  }
  
  // Check accelerometer for fall detection
  if (healthData.accelerometer) {
    const { x, y, z } = healthData.accelerometer;
    const magnitude = Math.sqrt(x*x + y*y + z*z);
    if (magnitude > 15) { // Threshold for fall detection
      anomalies.push('Potential fall detected');
    }
  }
  
  return anomalies;
}

// Emergency endpoint with enhanced notifications including SMS
app.post('/api/emergency', async (req, res) => {
  try {
    const { userId, reason, location, vitals, userInfo } = req.body;
    
    const emergency = new Emergency({
      userId,
      reason,
      location,
      vitals,
      userInfo: userInfo || {}
    });
    
    await emergency.save();
    
    // Get user details
    const user = await User.findOne({ phone: userId });
    if (user) {
      // Send all emergency notifications
      await handleEmergencyNotifications(user, emergency);
      
      // Send emergency SMS if contact available
      if (user.emergencyContact) {
        console.log(`Sending emergency SMS to ${user.emergencyContact}...`);
        await EmergencyServices.sendEmergencySMS(
          user.emergencyContact,
          emergency,
          user
        );
      }
    }
    
    // Broadcast emergency alert
    broadcast({
      type: 'emergency',
      data: emergency
    });
    
    res.json({ 
      success: true, 
      message: 'Emergency alert sent via all channels', 
      emergencyId: emergency._id,
      smsEnabled: !!user?.emergencyContact
    });
  } catch (error) {
    console.error('Emergency error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Handle emergency notifications
async function handleEmergencyNotifications(user, emergency) {
  const locationStr = emergency.location ? 
    `Location: https://maps.google.com/maps?q=${emergency.location.lat},${emergency.location.lng}` : 
    'Location: Not available';
  
  const vitalsStr = emergency.vitals ? 
    `Heart Rate: ${emergency.vitals.heartRate || 'N/A'} BPM, Temperature: ${emergency.vitals.temperature || 'N/A'}°C` : 
    'Vitals: Not available';
  
  const message = `
🚨 EMERGENCY ALERT 🚨

Patient: ${user.name}
Age: ${user.age}
Blood Group: ${user.bloodGroup || 'Unknown'}
Medical History: ${user.medicalHistory || 'None specified'}

Emergency: ${emergency.reason}
Time: ${new Date(emergency.timestamp).toLocaleString()}
${locationStr}
${vitalsStr}

This person needs immediate medical attention!
  `;
  
  // Send SMS to emergency contact
  if (user.emergencyContact) {
    await sendSMSAlert(user.emergencyContact, message);
  }
  
  // Send email if available
  if (user.email) {
    await sendEmailAlert(user.email, '🚨 Emergency Alert - Immediate Action Required', message);
  }
  
  // Here you would typically integrate with:
  // 1. Local emergency services API
  // 2. Hospital management systems
  // 3. Ambulance dispatch services
  // 4. Insurance providers
  
  console.log('Emergency notifications sent for user:', user.phone);
}

// Get user's health history
app.get('/api/health-history/:userId', async (req, res) => {
 try {
   const limit = parseInt(req.query.limit) || 100;
   const healthHistory = await HealthData.find({ userId: req.params.userId })
     .sort({ timestamp: -1 })
     .limit(limit);
   
   res.json({ success: true, data: healthHistory });
 } catch (error) {
   res.status(500).json({ success: false, message: error.message });
 }
});

// Get emergency history
app.get('/api/emergency-history/:userId', async (req, res) => {
 try {
   const emergencies = await Emergency.find({ userId: req.params.userId })
     .sort({ timestamp: -1 });
   
   res.json({ success: true, data: emergencies });
 } catch (error) {
   res.status(500).json({ success: false, message: error.message });
 }
});

// Enhanced dashboard data with analytics
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Get user details
    const user = await User.findOne({ phone: userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Get latest health data
    const latestHealth = await HealthData.findOne({ userId }).sort({ timestamp: -1 });
    
    // Get health history for analytics
    const healthHistory = await HealthData.find({ userId })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Analyze health trends
    const trends = HealthAnalytics.analyzeHealthTrends(healthHistory);
    
    // Detect patterns
    const patterns = HealthAnalytics.detectPatterns(healthHistory);
    
    // Generate insights
    const insights = HealthAnalytics.generateHealthInsights(user, healthHistory, trends, patterns);
    
    // Get health stats for last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weeklyStats = await HealthData.aggregate([
      { $match: { userId, timestamp: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: null,
          avgHeartRate: { $avg: '$vitals.heartRate' },
          avgTemperature: { $avg: '$vitals.temperature' },
          avgBloodPressure: { $avg: '$vitals.bloodPressure' },
          maxHeartRate: { $max: '$vitals.heartRate' },
          minHeartRate: { $min: '$vitals.heartRate' },
          totalReadings: { $sum: 1 },
          activeDays: { $addToSet: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } } }
        }
      }
    ]);
    
    // Get emergency count
    const emergencyCount = await Emergency.countDocuments({ userId });
    
    const statsData = weeklyStats[0] || {};
    if (statsData.activeDays) {
      statsData.activeDays = statsData.activeDays.length;
    }
    statsData.emergencyCount = emergencyCount;
    
    res.json({
      success: true,
      data: {
        user,
        latestHealth,
        weeklyStats: statsData,
        emergencyCount,
        trends,
        patterns,
        insights
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Serve main HTML file
app.get('/', (req, res) => {
 res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 RescueNet AI Server running on port ${PORT}`);
  console.log(`📡 WebSocket server running on port ${WEBSOCKET_PORT}`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}`);
  console.log(`📱 WebSocket: ws://localhost:${WEBSOCKET_PORT}`);
  
  if (process.env.NODE_ENV === 'development') {
    console.log('\n📋 Development Configuration:');
    console.log(`   MongoDB: ${mongoUri}`);
    console.log(`   Twilio SMS: ${twilioClient ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Email: ${emailTransporter ? '✅ Configured' : '❌ Not configured'}`);
  }
});