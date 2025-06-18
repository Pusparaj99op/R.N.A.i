# SIM800L GSM Module Integration Guide
## RescueNet AI - SMS Emergency Alert System

### 📱 SIM800L Overview
The SIM800L is a quad-band GSM/GPRS module that enables SMS and cellular connectivity for your RescueNet AI system. This integration allows for:
- **Emergency SMS alerts** to emergency contacts
- **Cellular backup** when WiFi is unavailable
- **Remote monitoring** capabilities
- **Real emergency service notifications**

---

## 🔌 Hardware Connections

### ⚠️ **CRITICAL POWER WARNING**
**SIM800L requires 3.7V to 4.2V power supply (NOT 5V!)**
Using 5V will permanently damage the module!

### Pin Connections Table

| SIM800L Pin | ESP32 Pin | Purpose | Wire Color (Suggested) |
|-------------|-----------|---------|------------------------|
| **VCC** | **3.3V** or External 3.7V | Power Supply | **Red** |
| **GND** | **GND** | Ground | **Black** |
| **TXD** | **GPIO 16** | Data Transmit | **Blue** |
| **RXD** | **GPIO 17** | Data Receive | **Green** |
| **RST** | **GPIO 14** | Reset Pin | **Yellow** |
| **PWR** | **GPIO 15** | Power Control | **Orange** |
| **DTR** | **Not Connected** | Data Terminal Ready | - |
| **RI** | **Not Connected** | Ring Indicator | - |

### 🔋 Power Supply Options

#### Option 1: External Power Supply (Recommended)
```
3.7V Li-Ion Battery → SIM800L VCC
ESP32 GND → SIM800L GND
```

#### Option 2: ESP32 3.3V Rail (Limited Current)
```
ESP32 3.3V → SIM800L VCC (May not provide enough current)
ESP32 GND → SIM800L GND
```

#### Option 3: Buck Converter (Best for Breadboard)
```
5V → Buck Converter → 3.8V → SIM800L VCC
GND → Buck Converter GND → SIM800L GND
```

---

## 🔧 Physical Wiring Diagram

```
ESP32 DevKit                    SIM800L Module
+-------------+                +----------------+
|        3.3V |--------------->| VCC            |
|         GND |--------------->| GND            |
|    GPIO 16  |--------------->| RXD            |
|    GPIO 17  |<---------------| TXD            |
|    GPIO 14  |--------------->| RST            |
|    GPIO 15  |--------------->| PWR            |
+-------------+                +----------------+
                                      |
                                 [Antenna]
```

### 📶 Antenna Connection
- **Required**: SIM800L MUST have an antenna connected
- **Type**: Small GSM antenna (usually comes with module)
- **Connection**: Screw-on or press-fit connector
- **Placement**: Keep antenna away from other electronics

---

## 💳 SIM Card Setup

### SIM Card Requirements
- **Type**: Standard SIM card (not micro/nano without adapter)
- **Plan**: Voice/SMS plan (data optional)
- **PIN**: Disable PIN code protection
- **Balance**: Ensure sufficient balance for SMS

### SIM Card Installation Steps
1. **Power OFF** the SIM800L module
2. **Insert SIM card** into the holder (contacts down)
3. **Ensure proper seating** of the card
4. **Power ON** the module
5. **Wait for network registration** (LED should blink slowly)

### Network Indicator LED
- **Fast blinking (1/sec)**: Searching for network
- **Slow blinking (3/sec)**: Connected to network
- **Solid ON**: Making a call/sending SMS

---

## 🛠️ Software Configuration

### Arduino IDE Library Requirements
```cpp
// No additional libraries needed
// SIM800L uses AT commands via Serial
```

### ESP32 Code Configuration
Update the following in your `esp32_enhanced.ino`:

```cpp
// Emergency contact number (include country code)
String emergencyContact = "+1234567890"; // Change to your emergency contact

// Enable/disable SMS functionality
bool smsEnabled = true;
```

### Pin Configuration (Already Updated)
```cpp
#define SIM800L_TX_PIN 17
#define SIM800L_RX_PIN 16
#define SIM800L_RST_PIN 14
#define SIM800L_PWR_PIN 15
```

---

## 📱 SMS Features

### Emergency SMS Content
When an emergency is detected, the following SMS is sent:
```
🚨 EMERGENCY ALERT - RescueNet AI 🚨
User: 1234567890
Time: 2025-06-18 10:30:45
Heart Rate: 120 BPM
Temperature: 38.5°C
SpO2: 92%
Location: GPS coordinates if available
Please respond immediately!
```

### Emergency Triggers
- **Manual**: Emergency button pressed
- **Automatic**: Heart rate anomalies detected
- **Automatic**: Temperature extremes detected
- **Automatic**: Low SpO2 levels detected
- **Automatic**: Fall detection (accelerometer)

---

## 🧪 Testing Your SIM800L Setup

### Step 1: Hardware Test
1. **Connect SIM800L** as per wiring diagram
2. **Insert active SIM card**
3. **Connect antenna**
4. **Power up ESP32**
5. **Check Serial Monitor** for SIM800L initialization

### Step 2: Network Registration Test
```
Expected Serial Output:
"Initializing SIM800L GSM Module..."
"SIM800L: Connected successfully"
"Configuring SMS settings..."
"SMS configuration complete"
```

### Step 3: SMS Test
1. **Press emergency button** on ESP32
2. **Check Serial Monitor** for SMS sending confirmation
3. **Verify SMS received** on emergency contact phone
4. **Check network LED** on SIM800L (should blink during SMS)

### Step 4: Signal Strength Test
Monitor signal strength in Serial output:
```
Signal strength: +CSQ: 15,0
(Range: 0-31, higher is better, minimum 10 for reliable SMS)
```

---

## 🔍 Troubleshooting

### Problem: SIM800L Not Responding
**Solutions:**
- Check power supply (must be 3.7V-4.2V)
- Verify wiring connections
- Ensure SIM card is properly inserted
- Check antenna connection

### Problem: "No Network" / Fast Blinking LED
**Solutions:**
- Check SIM card activation and balance
- Verify network coverage in your area
- Ensure antenna is properly connected
- Wait longer for network registration (can take 2-3 minutes)

### Problem: SMS Not Sending
**Solutions:**
- Check emergency contact number format (include country code)
- Verify SIM card has SMS capability and balance
- Check signal strength (minimum 10)
- Ensure SIM card PIN is disabled

### Problem: Power Issues
**Solutions:**
- Use external 3.7V power supply
- Check current capacity (SIM800L needs 2A peak)
- Add decoupling capacitors (1000µF recommended)
- Use separate power rail for SIM800L

---

## 💡 Tips for Best Performance

### Power Management
- **Use 3.7V Li-Ion battery** for best performance
- **Add 1000µF capacitor** across power pins
- **Keep power wires short** to reduce voltage drop
- **Monitor battery voltage** if using battery power

### Signal Optimization
- **Position antenna away** from ESP32 and other electronics
- **Extend antenna fully** if using whip antenna
- **Test in different locations** to find best signal
- **Check operator coverage** in your area

### Code Optimization
- **Implement retry logic** for failed SMS
- **Add SMS delivery confirmation** checking
- **Battery level monitoring** for power management
- **Network signal monitoring** for connection quality

---

## 📋 Final Checklist

Before deployment, verify:
- [ ] **SIM800L powers on** (LED activity)
- [ ] **Network registration successful** (slow blinking LED)
- [ ] **SMS test successful** (emergency contact receives test message)
- [ ] **Signal strength adequate** (>10 on CSQ command)
- [ ] **Emergency contact number correct** (with country code)
- [ ] **SIM card has sufficient balance**
- [ ] **Antenna properly connected**
- [ ] **Power supply stable** (3.7V-4.2V)

---

## 🆘 Emergency Contact Setup

### Recommended Emergency Contacts
1. **Primary**: Family member or close friend
2. **Secondary**: Local emergency services (if permitted)
3. **Tertiary**: Healthcare provider or doctor

### SMS Format Configuration
The system sends comprehensive health data including:
- **User identification**
- **Timestamp**
- **Current vital signs**
- **GPS location** (if GPS module connected)
- **Emergency reason** (manual or automatic trigger)

---

## 📞 Support

If you encounter issues with SIM800L integration:
1. **Check this guide** for common solutions
2. **Review Serial Monitor output** for error messages  
3. **Test with different SIM card** if network issues persist
4. **Contact your cellular provider** for SIM card issues
5. **Join RescueNet AI community** for technical support

Your SIM800L integration enables life-saving emergency SMS alerts! 🚑📱
