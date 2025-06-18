# SIM800L Connection Summary for RescueNet AI

## 🔗 Quick Connection Reference

### Pin-to-Pin Connections

```
ESP32 DevKit    →    SIM800L Module
─────────────────    ─────────────────
3.3V (or 3.7V)  →    VCC ⚠️ (3.7V-4.2V ONLY!)
GND             →    GND
GPIO 16         →    RXD  
GPIO 17         ←    TXD
GPIO 14         →    RST
GPIO 15         →    PWR
```

### ⚠️ **CRITICAL POWER WARNING**
**SIM800L requires 3.7V-4.2V power supply. Using 5V will permanently damage the module!**

## 🔌 Detailed Wiring Steps

### Step 1: Power Connections
```
SIM800L VCC ← 3.7V Li-Ion Battery (Recommended)
         OR ← ESP32 3.3V (Limited current - may not work reliably)
         OR ← Buck converter output (3.8V from 5V input)

SIM800L GND ← ESP32 GND (Common ground)
```

### Step 2: Data Connections
```
SIM800L RXD ← ESP32 GPIO 16 (Yellow/Green wire)
SIM800L TXD → ESP32 GPIO 17 (Blue wire)
```

### Step 3: Control Connections
```
SIM800L RST ← ESP32 GPIO 14 (White wire)
SIM800L PWR ← ESP32 GPIO 15 (Orange wire)
```

### Step 4: Antenna and SIM Card
```
SIM800L Antenna Connector ← GSM Antenna (REQUIRED!)
SIM800L SIM Card Slot ← Active SIM card (SMS plan required)
```

## 📱 SIM Card Setup Checklist

- [ ] **SIM card activated** with your carrier
- [ ] **SMS plan enabled** (prepaid or postpaid)
- [ ] **PIN code disabled** (important for automatic operation)
- [ ] **Sufficient balance** for SMS (if prepaid)
- [ ] **Network coverage** available in your area

## 🛠️ Hardware Shopping List

### Essential Components:
- **SIM800L Module** (~$10-15)
- **GSM Antenna** (usually included with module)
- **3.7V Li-Ion Battery** (1000mAh or higher recommended)
- **Active SIM Card** with SMS plan
- **Jumper Wires** (Male-to-Female)
- **Breadboard** (for prototyping)

### Optional Components:
- **Buck Converter** (5V to 3.8V)
- **Voltage Regulator** (for stable 3.7V)
- **Capacitors** (1000µF for power smoothing)
- **Level Shifters** (3.3V to 5V logic conversion)

## 🔧 Arduino IDE Configuration

### Required Settings:
```
Board: "ESP32 Dev Module"
Flash Mode: "DIO"
Flash Size: "4MB"
Upload Speed: "921600"
CPU Frequency: "240MHz (WiFi/BT)"
```

### Code Configuration:
```cpp
// Update these in esp32_enhanced.ino:
String emergencyContact = "+1234567890"; // Your emergency contact
bool smsEnabled = true;                   // Enable SMS functionality

// Pin definitions (already set):
#define SIM800L_TX_PIN 17
#define SIM800L_RX_PIN 16
#define SIM800L_RST_PIN 14
#define SIM800L_PWR_PIN 15
```

## 🧪 Testing Procedure

### Step 1: Power-On Test
1. Connect power (3.7V to VCC, GND to GND)
2. SIM800L should show LED activity
3. Wait for network registration (LED should blink slowly after 1-2 minutes)

### Step 2: Serial Communication Test
1. Upload ESP32 code
2. Open Serial Monitor (115200 baud)
3. Look for "SIM800L: Connected successfully" message

### Step 3: Network Registration Test
```
Expected output:
"Configuring SMS settings..."
"SMS configuration complete"
```

### Step 4: SMS Test
1. Press emergency button on ESP32
2. Check Serial Monitor for "SMS sent successfully"
3. Verify SMS received on emergency contact phone

## 📊 Signal Quality Indicators

### LED Behavior:
- **Fast blinking (1/sec)**: Searching for network
- **Slow blinking (3/sec)**: Connected to network  
- **Solid ON**: Sending SMS/making call

### Signal Strength Values:
```
+CSQ: 0,0    = No signal
+CSQ: 10,0   = Weak signal (minimum for SMS)
+CSQ: 15,0   = Good signal
+CSQ: 20+,0  = Excellent signal
```

## 🔍 Common Issues & Solutions

### Issue: Module doesn't power on
**Solution:** Check power supply voltage (must be 3.7V-4.2V)

### Issue: No network registration
**Solutions:**
- Check SIM card activation
- Verify antenna connection
- Ensure network coverage
- Wait longer (can take 3+ minutes)

### Issue: SMS not sending
**Solutions:**
- Check emergency contact number format (+country code)
- Verify SIM card balance
- Ensure SMS plan is active
- Check signal strength (minimum +CSQ: 10)

### Issue: ESP32 resets when sending SMS
**Solutions:**
- Use external 3.7V power supply
- Add 1000µF capacitor across power pins
- Check current capacity of power source

## 💡 Pro Tips

1. **Power Management**: Use a dedicated 3.7V Li-Ion battery for best performance
2. **Signal Optimization**: Position antenna away from ESP32 and other electronics
3. **Testing**: Start with a working SIM card in a phone to verify activation
4. **Debugging**: Monitor Serial output for AT command responses
5. **Backup**: Keep WiFi functionality as primary, SIM800L as backup

## 📞 Emergency Contact Format

Always use international format for emergency contacts:
```
✅ Correct: +1234567890
✅ Correct: +911234567890
❌ Wrong: 1234567890
❌ Wrong: (123) 456-7890
```

## 🚀 Ready to Deploy!

Once you've completed all connections and testing:

1. **Upload final code** to ESP32
2. **Configure emergency contact** in code
3. **Test emergency button** functionality
4. **Verify SMS delivery** to emergency contact
5. **Monitor for automatic health alerts**

Your RescueNet AI system now has cellular emergency SMS capability! 🚑📱

---

**Need help?** Check the detailed `SIM800L_SETUP_GUIDE.md` for comprehensive troubleshooting and advanced configuration options.
