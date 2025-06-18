# 📊 Detailed Connection Table - RescueNet AI

## 🔗 Complete ESP32 Pin Assignment Table

| ESP32 Pin | Pin Type | Component | Component Pin | Function | Wire Color | Resistor/Notes |
|-----------|----------|-----------|---------------|----------|------------|----------------|
| **3.3V** | Power | MAX30102 | VCC | Power Supply | Red | 3.3V Output |
| **3.3V** | Power | MPU6050 | VCC | Power Supply | Red | 3.3V Output |
| **3.3V** | Power | SSD1306 | VCC | Power Supply | Red | 3.3V Output |
| **3.3V** | Power | DS18B20 | Pin 3 (VCC) | Power Supply | Red | 3.3V Output |
| **3.3V** | Power | 4.7kΩ Resistor | One End | Pullup for DS18B20 | Red | Pullup Resistor |
| **GND** | Ground | MAX30102 | GND | Ground | Black | Common Ground |
| **GND** | Ground | MPU6050 | GND | Ground | Black | Common Ground |
| **GND** | Ground | SSD1306 | GND | Ground | Black | Common Ground |
| **GND** | Ground | DS18B20 | Pin 1 (GND) | Ground | Black | Common Ground |
| **GND** | Ground | SIM800L | GND | Ground | Black | Common Ground |
| **GND** | Ground | Status LED | Cathode (-) | Ground | Black | Via 220Ω Resistor |
| **GND** | Ground | Emergency LED | Cathode (-) | Ground | Black | Via 220Ω Resistor |
| **GND** | Ground | Buzzer | Negative (-) | Ground | Black | Direct Connection |
| **GND** | Ground | Button | Terminal 2 | Ground | Black | Direct Connection |
| **GPIO 0** | Digital Input | Emergency Button | Terminal 1 | Emergency Trigger | Purple | Internal Pullup |
| **GPIO 2** | Digital Output | Buzzer | Positive (+) | Audio Alert | White | Active Buzzer |
| **GPIO 4** | Digital I/O | DS18B20 | Pin 2 (Data) | Temperature Data | Orange | +4.7kΩ to 3.3V |
| **GPIO 5** | Digital Output | Status LED | Anode (+) | System Status | Green | +220Ω to GND |
| **GPIO 14** | Digital Output | SIM800L | RST | Reset Control | Yellow | SIM800L Reset |
| **GPIO 15** | Digital Output | SIM800L | PWR | Power Control | Orange | SIM800L Power |
| **GPIO 16** | UART RX | SIM800L | TXD | Serial Data RX | Blue | ESP32 ← SIM800L |
| **GPIO 17** | UART TX | SIM800L | RXD | Serial Data TX | Green | ESP32 → SIM800L |
| **GPIO 18** | Digital Output | Emergency LED | Anode (+) | Emergency Alert | Red | +220Ω to GND |
| **GPIO 21** | I2C SDA | MAX30102 | SDA | I2C Data | Blue | I2C Bus |
| **GPIO 21** | I2C SDA | MPU6050 | SDA | I2C Data | Blue | I2C Bus |
| **GPIO 21** | I2C SDA | SSD1306 | SDA | I2C Data | Blue | I2C Bus |
| **GPIO 22** | I2C SCL | MAX30102 | SCL | I2C Clock | Yellow | I2C Bus |
| **GPIO 22** | I2C SCL | MPU6050 | SCL | I2C Clock | Yellow | I2C Bus |
| **GPIO 22** | I2C SCL | SSD1306 | SCL | I2C Clock | Yellow | I2C Bus |

## 🔌 SIM800L Special Power Connection Table

| SIM800L Pin | ESP32 Connection | Power Source | Voltage | Current | Notes |
|-------------|------------------|--------------|---------|---------|-------|
| **VCC** | **NOT ESP32 3.3V** | **3.7V Li-Ion Battery** | **3.7V-4.2V** | **2A Peak** | ⚠️ CRITICAL: Do NOT use 5V! |
| **GND** | ESP32 GND | Common Ground | 0V | - | Shared ground rail |
| **RXD** | GPIO 16 | ESP32 3.3V Logic | 3.3V | <10mA | ESP32 transmits to SIM800L |
| **TXD** | GPIO 17 | SIM800L 3.7V Logic | 3.7V | <10mA | SIM800L transmits to ESP32 |
| **RST** | GPIO 14 | ESP32 3.3V Logic | 3.3V | <1mA | Reset control signal |
| **PWR** | GPIO 15 | ESP32 3.3V Logic | 3.3V | <1mA | Power control signal |
| **Antenna** | GSM Antenna | RF Signal | - | - | MUST be connected! |
| **SIM Slot** | SIM Card | Cellular Network | - | - | SMS plan required |

## 📏 Resistor and Component Values Table

| Component | Value/Rating | Quantity | Purpose | Connection |
|-----------|--------------|----------|---------|------------|
| **Pullup Resistor** | 4.7kΩ | 1 | DS18B20 Data Line | Between GPIO 4 and 3.3V |
| **LED Resistor** | 220Ω | 2 | Current Limiting | Status LED and Emergency LED |
| **Status LED** | Green 3mm/5mm | 1 | System Status | GPIO 5 → 220Ω → LED → GND |
| **Emergency LED** | Red 3mm/5mm | 1 | Emergency Alert | GPIO 18 → 220Ω → LED → GND |
| **Buzzer** | Active 5V/3V | 1 | Audio Alert | GPIO 2 → Buzzer+ / GND → Buzzer- |
| **Button** | Push Button | 1 | Emergency Trigger | GPIO 0 ↔ Button ↔ GND |
| **Li-Ion Battery** | 3.7V 1000mAh+ | 1 | SIM800L Power | Dedicated for SIM800L |
| **GSM Antenna** | 900/1800 MHz | 1 | Cellular Signal | SIM800L antenna connector |

## 🔍 I2C Device Address Table

| Device | I2C Address | Address Pin Configuration | Function |
|--------|-------------|-------------------------|----------|
| **MAX30102** | 0x57 | Fixed Address | Heart Rate & SpO2 Sensor |
| **MPU6050** | 0x68 | AD0 → GND | Accelerometer/Gyroscope |
| **MPU6050** | 0x69 | AD0 → VCC | Alternative address |
| **SSD1306** | 0x3C | Default | OLED Display (common) |
| **SSD1306** | 0x3D | Alternative | OLED Display (some modules) |

## ⚡ Power Consumption Analysis Table

| Component | Operating Voltage | Typical Current | Peak Current | Power | Notes |
|-----------|------------------|-----------------|--------------|-------|-------|
| **ESP32** | 3.3V | 80-160mA | 240mA | 0.26-0.79W | Higher with WiFi active |
| **MAX30102** | 3.3V | 1.6mA | 50mA | 0.165W | During LED pulse |
| **MPU6050** | 3.3V | 3.9mA | 3.9mA | 0.013W | Continuous operation |
| **SSD1306** | 3.3V | 20mA | 20mA | 0.066W | All pixels on |
| **DS18B20** | 3.3V | 1.5mA | 1.5mA | 0.005W | During conversion |
| **SIM800L** | 3.7V | 1mA | 2000mA | 7.4W | During SMS transmission |
| **Status LED** | 3.3V | 20mA | 20mA | 0.066W | When illuminated |
| **Emergency LED** | 3.3V | 20mA | 20mA | 0.066W | When illuminated |
| **Buzzer** | 3.3V | 30mA | 30mA | 0.099W | When sounding |
| **TOTAL** | - | **~160mA** | **~2.4A** | **~8W Peak** | SIM800L dominates peak |

## 🔧 Breadboard Connection Layout Table

| Breadboard Section | Row Range | Components | Power Rail Connection |
|-------------------|-----------|------------|---------------------|
| **Section 1** | 1-10 | ESP32 DevKit (if using adapter) | + Rail → 3.3V, - Rail → GND |
| **Section 2** | 11-15 | MAX30102 Heart Rate Sensor | + Rail → VCC, - Rail → GND |
| **Section 3** | 16-20 | MPU6050 Accelerometer | + Rail → VCC, - Rail → GND |
| **Section 4** | 21-25 | SSD1306 OLED Display | + Rail → VCC, - Rail → GND |
| **Section 5** | 26-30 | DS18B20 + 4.7kΩ Resistor | + Rail → VCC, - Rail → GND |
| **Section 6** | 31-35 | LEDs with 220Ω Resistors | GPIO pins → Resistors → LEDs → - Rail |
| **Section 7** | 36-40 | Buzzer and Button | GPIO pins and - Rail |
| **Section 8** | 41-50 | SIM800L Module | **Separate 3.7V Power!** |

## 📱 SIM800L AT Command Reference Table

| AT Command | Purpose | Expected Response | Notes |
|------------|---------|------------------|-------|
| **AT** | Test Communication | OK | Basic connectivity test |
| **AT+CREG?** | Network Registration | +CREG: 0,1 | 0,1 = registered home network |
| **AT+CSQ** | Signal Quality | +CSQ: 15,0 | 15 = good signal (0-31 scale) |
| **AT+CMGF=1** | SMS Text Mode | OK | Set SMS to text mode |
| **AT+CMGS="+1234567890"** | Send SMS | > | Prompt for message content |
| **Ctrl+Z** | Send SMS | +CMGS: 123 | Message sent successfully |

## 🧪 Testing Sequence Table

| Test Step | Component | Expected Result | Troubleshooting |
|-----------|-----------|----------------|-----------------|
| **1** | Power Supply | ESP32 LED on, 3.3V at sensors | Check power connections |
| **2** | SIM800L Power | LED activity on SIM800L | Verify 3.7V supply |
| **3** | I2C Scan | Find 0x3C, 0x57, 0x68 | Check SDA/SCL wiring |
| **4** | Temperature | 20-25°C room temperature | Check DS18B20 + pullup |
| **5** | Heart Rate | Detects finger placement | Clean MAX30102 sensor |
| **6** | Display | Shows text/graphics | Check I2C address |
| **7** | Accelerometer | Shows movement values | Check MPU6050 wiring |
| **8** | Button | Serial shows "pressed" | Check pullup configuration |
| **9** | LEDs | Status and emergency flash | Check resistor values |
| **10** | SIM800L Network | Slow blinking LED | Check SIM card/antenna |
| **11** | SMS Test | Emergency SMS received | Check contact number format |

## 🔍 Wire Color Coding Standard

| Wire Color | Purpose | Typical Use |
|------------|---------|-------------|
| **Red** | Power (+) | 3.3V/5V supply lines |
| **Black** | Ground (-) | All ground connections |
| **Blue** | Data | I2C SDA, Serial RX |
| **Yellow** | Clock/Control | I2C SCL, Reset pins |
| **Green** | Status/OK | Status LED, Serial TX |
| **Orange** | Data/Analog | Temperature sensor, Power control |
| **White** | Audio/Alert | Buzzer connections |
| **Purple** | Input/Button | User input connections |

## 🛠️ Tools Required Table

| Tool | Purpose | Notes |
|------|---------|-------|
| **Soldering Iron** | Permanent connections | 25-40W recommended |
| **Wire Strippers** | Prepare jumper wires | Multiple gauge capability |
| **Multimeter** | Voltage/continuity testing | Essential for debugging |
| **Breadboard** | Prototyping | 830 tie-point minimum |
| **Screwdrivers** | Assembly | Phillips and flathead |
| **Hot Glue Gun** | Strain relief | Optional for permanent install |
| **Heat Shrink Tubing** | Wire protection | Various sizes |
| **Crimping Tool** | Connector assembly | For dupont connectors |

## 📦 Shopping List with Part Numbers

| Component | Quantity | Approximate Cost | Supplier Part Number |
|-----------|----------|------------------|---------------------|
| **ESP32 DevKit V1** | 1 | $8-12 | ESP32-DEVKITV1 |
| **MAX30102 Module** | 1 | $5-8 | MAX30102-SENSOR |
| **MPU6050 Module** | 1 | $3-5 | GY-521 |
| **SSD1306 OLED** | 1 | $4-6 | SSD1306-128x64 |
| **DS18B20 Sensor** | 1 | $2-3 | DS18B20-TO92 |
| **SIM800L Module** | 1 | $10-15 | SIM800L-GSM |
| **3.7V Li-Ion Battery** | 1 | $8-12 | 18650-3.7V-2000mAh |
| **GSM Antenna** | 1 | $3-5 | GSM-ANT-SMA |
| **Breadboard** | 1 | $5-8 | BB830 |
| **Jumper Wires** | 40 pack | $3-5 | JUMP-WIRE-40 |
| **Resistors Kit** | 1 kit | $5-8 | RESISTOR-KIT-600 |
| **LEDs (Red/Green)** | 5 each | $2-3 | LED-5MM-PACK |
| **Active Buzzer** | 1 | $1-2 | BUZZER-ACTIVE-5V |
| **Push Button** | 1 | $1 | BUTTON-PUSH-12MM |

## 🚨 Safety and Warnings Table

| Hazard | Risk Level | Precaution |
|--------|------------|------------|
| **SIM800L 5V Power** | ⚠️ HIGH | Never apply 5V - will destroy module |
| **Short Circuits** | ⚠️ MEDIUM | Double-check connections before power |
| **Heat Generation** | ⚠️ MEDIUM | SIM800L gets warm during operation |
| **Battery Safety** | ⚠️ MEDIUM | Use protected Li-Ion batteries |
| **Static Discharge** | ⚠️ LOW | Use anti-static precautions |
| **Antenna Safety** | ⚠️ LOW | Don't operate SIM800L without antenna |

---

## 📞 Emergency Contact Configuration

Update these values in your ESP32 code:

```cpp
// Emergency contact (international format)
String emergencyContact = "+1234567890";

// SMS settings
bool smsEnabled = true;
bool wifiBackup = true;
```

This comprehensive connection table provides all the details you need to successfully wire and configure your RescueNet AI emergency response system! 🚑📱
