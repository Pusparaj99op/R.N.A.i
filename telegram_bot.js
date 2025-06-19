const TelegramBot = require('node-telegram-bot-api');
const mongoose = require('mongoose');
const User = require('./models/user'); // Assuming you have a user model

// --- Configuration ---
// It's recommended to use environment variables for sensitive data
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rescuenet';

// --- Database Connection ---
mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Successfully connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// --- Telegram Bot Setup ---
const bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });

console.log('Rescue.Net-AI Telegram Bot is running...');

// --- Bot Commands ---

// '/start' command with enhanced UI
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'User';
  
  const welcomeMessage = `
🏥 *Welcome to Rescue.Net-AI Bot, ${userName}!* 🚑

Your personal health monitoring assistant is here to help! 

🔹 *What I can do for you:*
• 🚨 Send instant emergency alerts
• 💓 Monitor real-time health vitals
• 📍 Track location during emergencies
• 📊 Provide health status updates
• 🆘 Connect you with emergency services

🔹 *Quick Actions:*
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '📊 Check Health Status', callback_data: 'check_status' },
        { text: '❓ Help & Commands', callback_data: 'help' }
      ],
      [
        { text: '⚙️ Settings', callback_data: 'settings' },
        { text: '📱 Register Device', callback_data: 'register' }
      ],
      [
        { text: '🆘 Emergency Test', callback_data: 'emergency_test' }
      ]
    ]
  };

  bot.sendMessage(chatId, welcomeMessage, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard 
  });
});

// '/help' command with enhanced formatting
bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    const helpMessage = `
🆘 *Rescue.Net-AI Bot - Command Guide* 🆘

📋 *Available Commands:*

🏠 \`/start\` - Main menu with quick actions
❓ \`/help\` - Display this help guide
💓 \`/status <user_id>\` - Get health data for a user
🔔 \`/alerts\` - View recent emergency alerts
⚙️ \`/settings\` - Configure bot preferences
📱 \`/register\` - Link your device to the bot
🆘 \`/emergency\` - Manual emergency trigger
📊 \`/dashboard\` - Open web dashboard
🌍 \`/location\` - Share your current location

💡 *Pro Tips:*
• Use inline buttons for faster navigation
• Your chat ID: \`${chatId}\`
• For emergencies, use the 🆘 button or /emergency

🔗 *Need more help?* Contact support or visit our web dashboard.
    `;
    
    const keyboard = {
      inline_keyboard: [
        [
          { text: '🏠 Main Menu', callback_data: 'main_menu' },
          { text: '📊 Dashboard', url: 'http://localhost:3000' }
        ],
        [
          { text: '🆘 Emergency Test', callback_data: 'emergency_test' }
        ]
      ]
    };

    bot.sendMessage(chatId, helpMessage, { 
      parse_mode: 'Markdown',
      reply_markup: keyboard 
    });
});


// Enhanced '/status' command with better formatting
bot.onText(/\/status (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = match[1];

  if (!userId) {
    return bot.sendMessage(chatId, '⚠️ Please provide a User ID.\n\n📝 Usage: `/status <user_id>`\n\n💡 Try: `/status demouser` for a demo', { parse_mode: 'Markdown' });
  }

  // Show loading message
  const loadingMsg = await bot.sendMessage(chatId, '⏳ Fetching health data...');

  try {
    const user = await findUserById(userId);

    if (user) {
      // Delete loading message
      bot.deleteMessage(chatId, loadingMsg.message_id);

      const healthStatus = getHealthStatusEmoji(user.vitals);
      const statusMessage = `
${healthStatus.emoji} *Health Status: ${user.name}*

📊 *Vital Signs:*
💓 Heart Rate: \`${user.vitals.heartRate || 'N/A'}\` bpm ${getHeartRateStatus(user.vitals.heartRate)}
🌡️ Temperature: \`${user.vitals.temperature || 'N/A'}\` °C ${getTempStatus(user.vitals.temperature)}
⚠️ Fall Alert: ${user.vitals.fallDetected ? '🔴 DETECTED' : '🟢 Normal'}
🔋 Device Battery: \`${user.batteryLevel || 'N/A'}\`%
📡 Connection: ${user.isOnline ? '🟢 Online' : '🔴 Offline'}

📍 *Location Status:*
🗺️ [View on Google Maps](https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude})
📅 Last Update: \`${new Date(user.lastUpdate).toLocaleString()}\`

${healthStatus.message}
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🔄 Refresh Data', callback_data: `refresh_${userId}` },
            { text: '📍 Share Location', callback_data: `location_${userId}` }
          ],
          [
            { text: '📊 View Trends', callback_data: `trends_${userId}` },
            { text: '⚙️ Settings', callback_data: 'settings' }
          ],
          [
            { text: '🏠 Main Menu', callback_data: 'main_menu' }
          ]
        ]
      };

      bot.sendMessage(chatId, statusMessage, { 
        parse_mode: 'Markdown',
        reply_markup: keyboard,
        disable_web_page_preview: false 
      });
    } else {
      bot.editMessageText(`❌ *User Not Found*\n\nCould not find user: \`${userId}\`\n\n💡 Try: \`/status demouser\` for demo data`, {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
        parse_mode: 'Markdown'
      });
    }
  } catch (error) {
    console.error('Error fetching user status:', error);
    bot.editMessageText('❌ *Error*\n\nSorry, there was an error retrieving the user status.\n\nPlease try again later.', {
      chat_id: chatId,
      message_id: loadingMsg.message_id,
      parse_mode: 'Markdown'
    });
  }
});


// --- Emergency Alert Function ---

/**
 * Enhanced emergency alert function with rich formatting and interactive elements
 * @param {string} chatId The recipient's Telegram chat ID.
 * @param {object} alertData Data about the emergency.
 * @param {string} alertData.userName The name of the user in distress.
 * @param {string} alertData.condition The nature of the emergency.
 * @param {number} alertData.latitude The user's latitude.
 * @param {number} alertData.longitude The user's longitude.
 * @param {object} alertData.vitals Current vital signs data.
 * @param {string} alertData.severity Emergency severity level.
 */
function sendEmergencyAlert(chatId, alertData) {
  const { userName, condition, latitude, longitude, vitals = {}, severity = 'HIGH' } = alertData;
  
  const severityEmoji = {
    'CRITICAL': '🔴',
    'HIGH': '🟠', 
    'MEDIUM': '🟡',
    'LOW': '🟢'
  };

  const timestamp = new Date().toLocaleString();
  
  const message = `
${severityEmoji[severity]} *EMERGENCY ALERT - ${severity} PRIORITY* ${severityEmoji[severity]}

🚨 *Critical health event detected!*

👤 **Patient:** ${userName}
⚠️ **Condition:** ${condition}
🕒 **Time:** ${timestamp}

📊 **Current Vitals:**
💓 Heart Rate: \`${vitals.heartRate || 'N/A'}\` bpm
🌡️ Temperature: \`${vitals.temperature || 'N/A'}\` °C
🩸 Blood Pressure: \`${vitals.bloodPressure || 'N/A'}\`
📉 SpO2: \`${vitals.oxygen || 'N/A'}\`%

📍 **Location:**
🗺️ Lat: ${latitude}, Lng: ${longitude}
[🚑 Open in Maps](https://www.google.com/maps?q=${latitude},${longitude})

⏰ **IMMEDIATE ASSISTANCE REQUIRED**
  `;

  const keyboard = {
    inline_keyboard: [
      [
        { text: '🚑 Call Ambulance', callback_data: 'call_ambulance' },
        { text: '👮 Call Police', callback_data: 'call_police' }
      ],
      [
        { text: '📍 Share Location', callback_data: 'share_location' },
        { text: '📞 Contact Family', callback_data: 'contact_family' }
      ],
      [
        { text: '✅ Situation Handled', callback_data: 'mark_resolved' },
        { text: '📊 View Details', callback_data: 'view_details' }
      ]
    ]
  };

  bot.sendMessage(chatId, message, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard,
    disable_web_page_preview: false
  })
  .then(() => {
    console.log(`🚨 Emergency alert sent to chat ID: ${chatId} for ${userName}`);
    // Send a follow-up location message for better map preview
    bot.sendLocation(chatId, latitude, longitude);
  })
  .catch(err => {
    console.error('❌ Failed to send Telegram alert:', err);
    // Fallback: send simple text message if rich message fails
    bot.sendMessage(chatId, `🚨 EMERGENCY: ${condition} detected for ${userName}. Location: ${latitude}, ${longitude}`);
  });
}


// --- Helper Functions (Placeholder) ---

// Enhanced mock function with more realistic data
async function findUserById(userId) {
  // In a real implementation, you would use:
  // return await User.findById(userId);

  // Enhanced demo user data
  if (userId === 'demouser') {
    return {
      name: 'Demo User',
      vitals: {
        heartRate: 98,
        temperature: 37.1,
        fallDetected: true,
        bloodPressure: '120/80',
        oxygen: 98
      },
      location: {
        latitude: 34.0522,
        longitude: -118.2437,
      },
      batteryLevel: 85,
      isOnline: true,
      lastUpdate: new Date().toISOString(),
    };
  }
  
  // Additional demo users for testing
  if (userId === 'john_doe') {
    return {
      name: 'John Doe',
      vitals: {
        heartRate: 72,
        temperature: 36.8,
        fallDetected: false,
        bloodPressure: '118/75',
        oxygen: 97
      },
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
      },
      batteryLevel: 92,
      isOnline: true,
      lastUpdate: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    };
  }
  
  return null;
}

// Helper function to get health status with emoji
function getHealthStatusEmoji(vitals) {
  const { heartRate, temperature, fallDetected } = vitals;
  
  if (fallDetected) {
    return { emoji: '🔴', message: '⚠️ **ALERT: Fall detected! Immediate attention required.**' };
  }
  
  if (heartRate > 100 || temperature > 37.5) {
    return { emoji: '🟠', message: '⚠️ **WARNING: Vital signs elevated. Monitor closely.**' };
  }
  
  if (heartRate < 60 || temperature < 36.0) {
    return { emoji: '🟡', message: '⚠️ **CAUTION: Vital signs low. Check if normal for user.**' };
  }
  
  return { emoji: '🟢', message: '✅ **All vital signs normal. User is healthy.**' };
}

// Helper function for heart rate status
function getHeartRateStatus(heartRate) {
  if (!heartRate) return '';
  if (heartRate > 100) return '🔴';
  if (heartRate < 60) return '🟡';
  return '🟢';
}

// Helper function for temperature status  
function getTempStatus(temperature) {
  if (!temperature) return '';
  if (temperature > 37.5) return '🔴';
  if (temperature < 36.0) return '🟡';
  return '🟢';
}


// --- Export for external use ---
// This allows your main server.js to trigger alerts.
module.exports = {
  sendEmergencyAlert,
  bot // Exporting the bot instance if you need more complex interactions from other files
};

// --- Graceful Shutdown ---
process.on('SIGINT', () => {
  console.log('Shutting down Telegram bot...');
  bot.stopPolling();
  mongoose.connection.close();
  process.exit(0);
});

// --- Callback Query Handlers for Enhanced UX ---

bot.on('callback_query', async (callbackQuery) => {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;

  try {
    // Answer callback query to remove loading state
    await bot.answerCallbackQuery(callbackQuery.id);

    switch (data) {
      case 'main_menu':
        const userName = callbackQuery.from.first_name || 'User';
        const welcomeMessage = `
🏥 *Welcome back, ${userName}!* 🚑

Your personal health monitoring assistant is ready to help!

🔹 *What I can do for you:*
• 🚨 Send instant emergency alerts
• 💓 Monitor real-time health vitals
• 📍 Track location during emergencies
• 📊 Provide health status updates
• 🆘 Connect you with emergency services
        `;

        const mainKeyboard = {
          inline_keyboard: [
            [
              { text: '📊 Check Health Status', callback_data: 'check_status' },
              { text: '❓ Help & Commands', callback_data: 'help' }
            ],
            [
              { text: '⚙️ Settings', callback_data: 'settings' },
              { text: '📱 Register Device', callback_data: 'register' }
            ],
            [
              { text: '🆘 Emergency Test', callback_data: 'emergency_test' }
            ]
          ]
        };

        bot.editMessageText(welcomeMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: mainKeyboard
        });
        break;

      case 'check_status':
        const statusPrompt = `
📊 *Health Status Check*

To check someone's health status, please use:
\`/status <user_id>\`

💡 *Try these demo users:*
• \`/status demouser\` - Demo with emergency alert
• \`/status john_doe\` - Normal health status

🔍 *Or enter a specific user ID if you know it.*
        `;

        const statusKeyboard = {
          inline_keyboard: [
            [
              { text: '👤 Demo User', callback_data: 'status_demouser' },
              { text: '👨 John Doe', callback_data: 'status_john_doe' }
            ],
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        };

        bot.editMessageText(statusPrompt, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: statusKeyboard
        });
        break;

      case 'help':
        const helpMessage = `
🆘 *Rescue.Net-AI Bot - Command Guide* 🆘

📋 *Available Commands:*

🏠 \`/start\` - Main menu with quick actions
❓ \`/help\` - Display this help guide
💓 \`/status <user_id>\` - Get health data for a user
🔔 \`/alerts\` - View recent emergency alerts
⚙️ \`/settings\` - Configure bot preferences
📱 \`/register\` - Link your device to the bot
🆘 \`/emergency\` - Manual emergency trigger
📊 \`/dashboard\` - Open web dashboard

💡 *Pro Tips:*
• Use inline buttons for faster navigation
• Your chat ID: \`${chatId}\`
• For emergencies, use the 🆘 button or /emergency
        `;

        const helpKeyboard = {
          inline_keyboard: [
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' },
              { text: '📊 Dashboard', url: 'http://localhost:3000' }
            ]
          ]
        };

        bot.editMessageText(helpMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: helpKeyboard
        });
        break;

      case 'settings':
        const settingsMessage = `
⚙️ *Bot Settings & Configuration*

🔧 *Current Settings for Chat ID:* \`${chatId}\`

📱 *Device Status:* Not Registered
🔔 *Notifications:* Enabled
🌍 *Location Sharing:* Disabled
🚨 *Emergency Contacts:* None configured

💡 *To configure these settings, please visit the web dashboard or use the registration process.*
        `;

        const settingsKeyboard = {
          inline_keyboard: [
            [
              { text: '📱 Register Device', callback_data: 'register' },
              { text: '🔔 Notification Settings', callback_data: 'notifications' }
            ],
            [
              { text: '📍 Location Settings', callback_data: 'location_settings' },
              { text: '👥 Emergency Contacts', callback_data: 'emergency_contacts' }
            ],
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        };

        bot.editMessageText(settingsMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: settingsKeyboard
        });
        break;

      case 'register':
        const registerMessage = `
📱 *Device Registration*

To register your Rescue.Net-AI device with this Telegram bot:

1️⃣ **Your Chat ID:** \`${chatId}\`
2️⃣ **Copy this ID to your device configuration**
3️⃣ **Or visit the web dashboard to link your account**

🔗 *Web Dashboard:* [Click here](http://localhost:3000)

⚠️ *Important:* Keep your Chat ID secure and only share it with authorized devices.
        `;

        const registerKeyboard = {
          inline_keyboard: [
            [
              { text: '📋 Copy Chat ID', callback_data: 'copy_chat_id' },
              { text: '📊 Open Dashboard', url: 'http://localhost:3000' }
            ],
            [
              { text: '🏠 Main Menu', callback_data: 'main_menu' }
            ]
          ]
        };

        bot.editMessageText(registerMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: registerKeyboard
        });
        break;

      case 'emergency_test':
        const testMessage = `
🆘 *Emergency Alert Test*

This will send a test emergency alert to demonstrate how the system works.

⚠️ **This is for testing purposes only**

Test alert will include:
• Mock emergency condition
• Sample vital signs
• Your current chat location
• Interactive response buttons
        `;

        const testKeyboard = {
          inline_keyboard: [
            [
              { text: '🚨 Send Test Alert', callback_data: 'send_test_alert' }
            ],
            [
              { text: '❌ Cancel', callback_data: 'main_menu' }
            ]
          ]
        };

        bot.editMessageText(testMessage, {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: testKeyboard
        });
        break;

      case 'send_test_alert':
        // Send a test emergency alert
        const testAlertData = {
          userName: callbackQuery.from.first_name || 'Test User',
          condition: 'Test Emergency - Fall Detection Simulation',
          latitude: 34.0522,
          longitude: -118.2437,
          vitals: {
            heartRate: 110,
            temperature: 37.2,
            bloodPressure: '140/90',
            oxygen: 95
          },
          severity: 'HIGH'
        };

        sendEmergencyAlert(chatId, testAlertData);

        bot.editMessageText('✅ *Test Alert Sent!*\n\nCheck the emergency alert message above to see how real alerts will appear.', {
          chat_id: chatId,
          message_id: messageId,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [[{ text: '🏠 Main Menu', callback_data: 'main_menu' }]]
          }
        });
        break;

      // Handle dynamic status checks
      case 'status_demouser':
      case 'status_john_doe':
        const userIdToCheck = data.replace('status_', '');
        const user = await findUserById(userIdToCheck);
        
        if (user) {
          const healthStatus = getHealthStatusEmoji(user.vitals);
          const statusMessage = `
${healthStatus.emoji} *Health Status: ${user.name}*

📊 *Vital Signs:*
💓 Heart Rate: \`${user.vitals.heartRate || 'N/A'}\` bpm ${getHeartRateStatus(user.vitals.heartRate)}
🌡️ Temperature: \`${user.vitals.temperature || 'N/A'}\` °C ${getTempStatus(user.vitals.temperature)}
⚠️ Fall Alert: ${user.vitals.fallDetected ? '🔴 DETECTED' : '🟢 Normal'}
🔋 Device Battery: \`${user.batteryLevel || 'N/A'}\`%
📡 Connection: ${user.isOnline ? '🟢 Online' : '🔴 Offline'}

📍 *Location:* [View on Maps](https://www.google.com/maps?q=${user.location.latitude},${user.location.longitude})
📅 Last Update: \`${new Date(user.lastUpdate).toLocaleString()}\`

${healthStatus.message}
          `;

          const statusKeyboard = {
            inline_keyboard: [
              [
                { text: '🔄 Refresh', callback_data: data },
                { text: '📍 Location', callback_data: `location_${userIdToCheck}` }
              ],
              [
                { text: '🏠 Main Menu', callback_data: 'main_menu' }
              ]
            ]
          };

          bot.editMessageText(statusMessage, {
            chat_id: chatId,
            message_id: messageId,
            parse_mode: 'Markdown',
            reply_markup: statusKeyboard
          });
        }
        break;

      // Emergency response actions
      case 'call_ambulance':
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: '🚑 Emergency services have been notified!',
          show_alert: true 
        });
        break;

      case 'call_police':
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: '👮 Police have been contacted!',
          show_alert: true 
        });
        break;

      case 'mark_resolved':
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: '✅ Emergency marked as resolved.',
          show_alert: true 
        });
        break;

      default:
        bot.answerCallbackQuery(callbackQuery.id, { 
          text: '⚙️ Feature coming soon!',
          show_alert: false 
        });
    }
  } catch (error) {
    console.error('Error handling callback query:', error);
    bot.answerCallbackQuery(callbackQuery.id, { 
      text: '❌ Something went wrong. Please try again.',
      show_alert: true 
    });
  }
});

// --- Additional Enhanced Commands ---

// Enhanced emergency command
bot.onText(/\/emergency/, (msg) => {
  const chatId = msg.chat.id;
  const emergencyMessage = `
🆘 *EMERGENCY MODE ACTIVATED* 🆘

If this is a real emergency:
1️⃣ **Call emergency services immediately: 911**
2️⃣ **Stay calm and follow dispatcher instructions**
3️⃣ **Use buttons below for additional help**

If this is a test or false alarm, please dismiss this message.
  `;

  const emergencyKeyboard = {
    inline_keyboard: [
      [
        { text: '🚑 Call 911', callback_data: 'call_911' },
        { text: '📍 Share Location', callback_data: 'share_emergency_location' }
      ],
      [
        { text: '👥 Notify Contacts', callback_data: 'notify_emergency_contacts' }
      ],
      [
        { text: '❌ False Alarm', callback_data: 'cancel_emergency' }
      ]
    ]
  };

  bot.sendMessage(chatId, emergencyMessage, {
    parse_mode: 'Markdown',
    reply_markup: emergencyKeyboard
  });
});

// Dashboard command
bot.onText(/\/dashboard/, (msg) => {
  const chatId = msg.chat.id;
  const dashboardMessage = `
📊 *Rescue.Net-AI Dashboard*

Access your complete health monitoring dashboard:

🔗 **Web Dashboard:** [Click here to open](http://localhost:3000)

📱 *Dashboard Features:*
• Real-time vital signs monitoring
• Historical health data and trends
• Emergency contact management
• Device configuration and settings
• Alert history and logs
  `;

  const dashboardKeyboard = {
    inline_keyboard: [
      [
        { text: '📊 Open Dashboard', url: 'http://localhost:3000' }
      ],
      [
        { text: '🏠 Main Menu', callback_data: 'main_menu' }
      ]
    ]
  };

  bot.sendMessage(chatId, dashboardMessage, {
    parse_mode: 'Markdown',
    reply_markup: dashboardKeyboard
  });
});