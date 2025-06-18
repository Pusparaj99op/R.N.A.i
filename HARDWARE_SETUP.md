# ESP32 & Arduino Setup Guide for RescueNet AI

## 📋 Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [Software Setup](#software-setup)
3. [ESP32 Setup & Programming](#esp32-setup--programming)
4. [Arduino Nano Setup](#arduino-nano-setup)
5. [Sensor Connections](#sensor-connections)
6. [Code Upload Process](#code-upload-process)
7. [Troubleshooting](#troubleshooting)

## 🛠️ Hardware Requirements

### ESP32 Development Board
- **ESP32 DevKit V1** or **ESP32 WROOM-32** (recommended)
- **Power**: 5V via USB or 3.3V
- **WiFi & Bluetooth**: Built-in
- **GPIO Pins**: 30+ digital pins
- **ADC**: 12-bit, multiple channels

### Arduino Nano (Alternative/Additional)
- **Arduino Nano V3.0** (ATmega328P)
- **Power**: 5V via USB or 7-12V external
- **Digital Pins**: 14 (6 PWM)
- **Analog Pins**: 8
- **Flash Memory**: 32KB

### Required Sensors
1. **MAX30102** - Heart Rate & SpO2 Sensor
2. **DS18B20** - Temperature Sensor
3. **MPU6050** - Accelerometer/Gyroscope
4. **SSD1306** - OLED Display (128x64)
5. **SIM800L** - GSM Module (SMS emergency alerts)
6. **GPS Module** (optional for location tracking)

### Additional Components
- **Buzzer** (Active/Passive)
- **LEDs** (Status indicators)
- **Push Button** (Emergency)
- **Resistors** (4.7kΩ, 10kΩ)
- **Breadboard/PCB**
- **Jumper Wires**
- **Power Supply** (3.3V/5V)
- **3.7V Li-Ion Battery** (for SIM800L)
- **GSM Antenna** (for SIM800L)
- **Active SIM Card** (with SMS plan)

## 💻 Software Setup

### 1. Install Arduino IDE

#### Download & Install:
1. Go to https://www.arduino.cc/en/software
2. Download Arduino IDE 2.0 (latest version)
3. Install with default settings
4. Launch Arduino IDE

## 📊 QUICK CONNECTION TABLE - START HERE

### Power Connections (Do First)
```
ESP32 3.3V → Breadboard + Rail (Red wire)
ESP32 GND  → Breadboard - Rail (Black wire)
```

### I2C Bus (All sensors share these)
```
ESP32 GPIO 21 → All I2C SDA pins (Blue wire)
ESP32 GPIO 22 → All I2C SCL pins (Yellow wire)
```

### Each Sensor Connections
```
MAX30102:  VCC→+Rail, GND→-Rail, SDA→GPIO21, SCL→GPIO22
MPU6050:   VCC→+Rail, GND→-Rail, SDA→GPIO21, SCL→GPIO22, AD0→GND
OLED:      VCC→+Rail, GND→-Rail, SDA→GPIO21, SCL→GPIO22
DS18B20:   VCC→+Rail, GND→-Rail, Data→GPIO4 (+4.7kΩ to +Rail)
```

### LEDs and Controls
```
Status LED:     GPIO5 → 220Ω → LED+ / LED- → GND
Emergency LED:  GPIO18 → 220Ω → LED+ / LED- → GND
Buzzer:         GPIO2 → Buzzer+ / Buzzer- → GND
Button:         GPIO0 ↔ Button ↔ GND
```

### SIM800L (Special 3.7V Power!)
```
⚠️ Use 3.7V Li-Ion Battery for SIM800L VCC (NOT 3.3V!)
SIM800L VCC → 3.7V Battery+
SIM800L GND → Battery- & ESP32 GND
SIM800L RXD → ESP32 GPIO16
SIM800L TXD → ESP32 GPIO17
SIM800L RST → ESP32 GPIO14
SIM800L PWR → ESP32 GPIO15
+ Connect antenna and insert SIM card
```

#### Alternative: PlatformIO (Advanced)
```bash
# Install VS Code first, then PlatformIO extension
# Better for complex projects
```

### 2. Install ESP32 Board Support

#### Method 1: Board Manager
1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://dl.espressif.com/dl/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search "ESP32"
6. Install **"ESP32 by Espressif Systems"**

#### Method 2: Manual Installation
```bash
# Clone ESP32 Arduino Core
git clone https://github.com/espressif/arduino-esp32.git
# Follow manual installation guide
```

### 3. Install Required Libraries

#### Via Library Manager:
Go to **Tools → Manage Libraries** and install:

```
Core Libraries:
- WiFi (ESP32 built-in)
- WebSocketsClient by Markus Sattler
- ArduinoJson by Benoit Blanchon
- HTTPClient (ESP32 built-in)

Sensor Libraries:
- OneWire by Jim Studt
- DallasTemperature by Miles Burton
- Adafruit MPU6050 by Adafruit
- MAX30105 library by SparkFun
- SparkFun MAX3010x library

Display Libraries:
- ESP8266 and ESP32 OLED driver for SSD1306 displays
- Adafruit GFX Library
- Adafruit SSD1306

Communication Libraries:
- TinyGSM (for SIM800L)
- SoftwareSerial (for GPS)
```

#### Manual Library Installation:
1. Download library ZIP files
2. **Sketch → Include Library → Add .ZIP Library**
3. Select downloaded ZIP files

## 🔌 ESP32 Pin Connections

### ESP32 DevKit V1 Pinout
```
                    ESP32 DevKit V1
                   ┌─────────────────┐
                   │  ┌─┐       ┌─┐  │
                   │  │•│  USB  │•│  │
                   │  └─┘       └─┘  │
                   │                 │
   3V3  ──────────┤ 3V3         VIN ├────────── 5V Power
   GND  ──────────┤ GND         GND ├────────── Ground
   GPIO2 ─────────┤ D2          D13 ├────────── GPIO13
   GPIO4 ─────────┤ D4          D12 ├────────── GPIO12
   GPIO16 ────────┤ D16         D14 ├────────── GPIO14
   GPIO17 ────────┤ D17         D27 ├────────── GPIO27
   GPIO5 ─────────┤ D5          D26 ├────────── GPIO26
   GPIO18 ────────┤ D18         D25 ├────────── GPIO25
   GPIO19 ────────┤ D19         D33 ├────────── GPIO33
   GPIO21 ────────┤ D21         D32 ├────────── GPIO32
   GPIO22 ────────┤ D22         D35 ├────────── GPIO35
   GPIO23 ────────┤ D23         D34 ├────────── GPIO34
                  └─────────────────┘
```

### RescueNet AI Connections

#### Core Connections:
```
Component          ESP32 Pin    Wire Color    Notes
─────────────────────────────────────────────────────
Power Supply:
VCC/3.3V     →     3V3          Red          Power all 3.3V sensors
GND          →     GND          Black        Common ground

I2C Bus (Multiple sensors):
SDA          →     GPIO21       Blue         I2C Data
SCL          →     GPIO22       Yellow       I2C Clock

Temperature Sensor:
DS18B20 Data →     GPIO4        Orange       OneWire data
DS18B20 VCC  →     3V3          Red          Power
DS18B20 GND  →     GND          Black        Ground
Pull-up Res  →     4.7kΩ between Data & VCC

Status Indicators:
Status LED   →     GPIO5        Green        System status
Emergency LED →    GPIO18       Red          Emergency alert
Buzzer (+)   →     GPIO2        White        Audio alerts
Buzzer (-)   →     GND          Black        Ground

User Interface:
Emergency Btn →    GPIO0        Purple       Emergency button
Button GND   →     GND          Black        Ground (internal pull-up)
```

#### I2C Devices (All use GPIO21/GPIO22):
```
Device              I2C Address    Power    Notes
─────────────────────────────────────────────────
MAX30102 (Heart)    0x57          3.3V     Heart rate sensor
MPU6050 (Accel)     0x68          3.3V     Motion sensor  
SSD1306 (Display)   0x3C          3.3V     OLED display
```

#### Optional Connections:
```
Component          ESP32 Pin    Notes
─────────────────────────────────────────
GPS Module:
GPS TX       →     GPIO16       GPS to ESP32
GPS RX       →     GPIO17       ESP32 to GPS
GPS VCC      →     3V3          Power
GPS GND      →     GND          Ground

SIM800L (GSM):
SIM TX       →     GPIO26       SIM to ESP32
SIM RX       →     GPIO27       ESP32 to SIM
SIM VCC      →     3.7V         Needs higher voltage
SIM GND      →     GND          Ground
```

## 🔄 Arduino Nano Connections (Alternative)

### Arduino Nano Pinout
```
                    Arduino Nano
             ┌─────────────────────────┐
             │  ┌─┐             ┌─┐   │
             │  │•│    USB      │•│   │
             │  └─┘             └─┘   │
  D12 ──────┤ 12                13 ├──── D13 (LED)
  D11 ──────┤ 11                A0 ├──── A0
  D10 ──────┤ 10                A1 ├──── A1  
  D9  ──────┤ 9                 A2 ├──── A2
  D8  ──────┤ 8                 A3 ├──── A3
  D7  ──────┤ 7                 A4 ├──── A4 (SDA)
  D6  ──────┤ 6                 A5 ├──── A5 (SCL)
  D5  ──────┤ 5                 A6 ├──── A6
  D4  ──────┤ 4                 A7 ├──── A7
  D3  ──────┤ 3                 5V ├──── 5V
  D2  ──────┤ 2                GND ├──── GND
  RST ──────┤ RST              RST ├──── Reset
  GND ──────┤ GND               VIN ├──── 7-12V
             └─────────────────────────┘
```

### Nano Connections for RescueNet:
```
Component          Nano Pin     Notes
─────────────────────────────────────────
I2C Sensors:
SDA          →     A4           I2C Data
SCL          →     A5           I2C Clock

Temperature:
DS18B20      →     D4           OneWire data

Status:
Status LED   →     D5           System status
Emergency LED →    D6           Emergency alert
Buzzer       →     D7           Audio alerts
Button       →     D2           Emergency button

Communication:
ESP8266 TX   →     D8           WiFi module
ESP8266 RX   →     D9           WiFi module
```

## 📤 Code Upload Process

### ESP32 Upload Steps:

#### 1. Hardware Setup:
```
1. Connect ESP32 to computer via USB cable
2. Install CP2102 or CH340 drivers if needed
3. Verify COM port in Device Manager
```

#### 2. Arduino IDE Configuration:
```
1. Tools → Board → ESP32 Arduino → "ESP32 Dev Module"
2. Tools → Port → Select COM port (e.g., COM3)
3. Tools → Upload Speed → "921600"
4. Tools → CPU Frequency → "240MHz (WiFi/BT)"
5. Tools → Flash Frequency → "80MHz"
6. Tools → Flash Mode → "QIO"
7. Tools → Flash Size → "4MB (32Mb)"
8. Tools → Partition Scheme → "Default 4MB with spiffs"
```

#### 3. Upload Code:
```cpp
// 1. Open esp32_enhanced.ino
// 2. Modify WiFi credentials:
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// 3. Update server IP:
const char* serverHost = "192.168.1.100"; // Your computer's IP

// 4. Set user ID:
String userId = "1234567890"; // Your phone number

// 5. Click Upload button (→) or Ctrl+U
```

#### 4. Monitor Serial Output:
```
1. Tools → Serial Monitor
2. Set baud rate to 115200
3. Watch for connection messages
```

### Arduino Nano Upload Steps:

#### 1. Board Configuration:
```
1. Tools → Board → Arduino AVR Boards → "Arduino Nano"
2. Tools → Processor → "ATmega328P (Old Bootloader)" 
   - Try this first if upload fails
3. Tools → Port → Select COM port
```

#### 2. Upload Process:
```cpp
// 1. Open nano_backup.ino or create new sketch
// 2. Modify for Nano-specific pins
// 3. Click Upload
```

## 🔧 Detailed Connection Diagrams

### Complete ESP32 Wiring:
```
ESP32 Board Layout:
                    ┌─ 3V3 (Red to all sensor VCC)
                    ├─ GND (Black to all sensor GND)  
                    ├─ GPIO21 (Blue to all SDA)
                    ├─ GPIO22 (Yellow to all SCL)
                    ├─ GPIO4 (Orange to DS18B20)
                    ├─ GPIO2 (White to Buzzer+)
                    ├─ GPIO5 (Green to Status LED)
                    ├─ GPIO18 (Red to Emergency LED)
                    └─ GPIO0 (Purple to Button)

Breadboard Layout:
┌────────────────────────────────────────────────┐
│  Power Rails:                                  │
│  [+] ←── 3V3 (Red wire from ESP32)            │
│  [-] ←── GND (Black wire from ESP32)          │
│                                                │
│  I2C Bus:                                      │
│  SDA ←── GPIO21 (Blue wire)                   │
│  SCL ←── GPIO22 (Yellow wire)                 │
│                                                │
│  Sensors Connected:                            │
│  MAX30102: VCC[+] GND[-] SDA[Blue] SCL[Yellow]│
│  MPU6050:  VCC[+] GND[-] SDA[Blue] SCL[Yellow]│
│  OLED:     VCC[+] GND[-] SDA[Blue] SCL[Yellow]│
│  DS18B20:  VCC[+] GND[-] DATA[Orange+4.7kΩ]  │
└────────────────────────────────────────────────┘
```

### Step-by-Step Wiring:

#### Step 1: Power Distribution
```
1. Connect ESP32 3V3 → Breadboard positive rail (Red wire)
2. Connect ESP32 GND → Breadboard negative rail (Black wire)
3. Connect all sensor VCC pins to positive rail
4. Connect all sensor GND pins to negative rail
```

#### Step 2: I2C Bus
```
1. Connect ESP32 GPIO21 → Common SDA line (Blue wire)
2. Connect ESP32 GPIO22 → Common SCL line (Yellow wire)
3. Connect all I2C sensors to common SDA/SCL lines
```

#### Step 3: Individual Sensors
```
DS18B20 Temperature:
┌─────────────┐
│    DS18B20  │
│             │
│  VCC  DATA  GND
│   │    │    │
└───┼────┼────┼───
    │    │    │
   3V3  GPIO4 GND
    │    │    │
    └────┼────┘
         │
    4.7kΩ resistor between VCC and DATA
```

#### Step 4: Status Indicators
```
Status LED:
GPIO5 →[220Ω resistor]→[LED]→ GND

Emergency LED:
GPIO18 →[220Ω resistor]→[Red LED]→ GND

Buzzer:
GPIO2 → Buzzer (+)
GND   → Buzzer (-)
```

#### Step 5: Emergency Button
```
Emergency Button:
GPIO0 →[Button]→ GND
(Uses internal pull-up, no external resistor needed)
```

## 📊 Testing Your Setup

### 1. Basic Connection Test:
```cpp
// Upload this test code first:
void setup() {
  Serial.begin(115200);
  Serial.println("RescueNet AI Hardware Test");
  
  // Test pins
  pinMode(2, OUTPUT);  // Buzzer
  pinMode(5, OUTPUT);  // Status LED
  pinMode(18, OUTPUT); // Emergency LED
  pinMode(0, INPUT_PULLUP); // Button
}

void loop() {
  // Flash LEDs
  digitalWrite(5, HIGH);
  digitalWrite(18, LOW);
  delay(500);
  
  digitalWrite(5, LOW);
  digitalWrite(18, HIGH);
  delay(500);
  
  // Check button
  if (digitalRead(0) == LOW) {
    tone(2, 1000, 500); // Beep
    Serial.println("Button pressed!");
  }
}
```

### 2. I2C Scanner:
```cpp
// Find connected I2C devices:
#include <Wire.h>

void setup() {
  Wire.begin(21, 22); // SDA, SCL
  Serial.begin(115200);
  Serial.println("I2C Scanner");
}

void loop() {
  byte error, address;
  int nDevices = 0;
  
  for(address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      Serial.print(address, HEX);
      Serial.println();
      nDevices++;
    }
  }
  
  if (nDevices == 0) {
    Serial.println("No I2C devices found");
  }
  
  delay(5000);
}
```

### Expected I2C Addresses:
```
0x3C - SSD1306 OLED Display
0x57 - MAX30102 Heart Rate Sensor  
0x68 - MPU6050 Accelerometer
```

## 🚨 Troubleshooting

### Common Upload Issues:

#### ESP32 Won't Upload:
```
Problem: "Failed to connect to ESP32"
Solutions:
1. Hold BOOT button while clicking Upload
2. Try different USB cable
3. Install CP2102/CH340 drivers
4. Lower upload speed to 115200
5. Check COM port selection
```

#### Arduino Nano Issues:
```
Problem: "avrdude: stk500_recv(): programmer is not responding"
Solutions:
1. Select "ATmega328P (Old Bootloader)" processor
2. Try different USB cable
3. Press reset button just before upload
4. Check COM port
```

### Sensor Issues:

#### I2C Not Working:
```
Symptoms: I2C scanner finds no devices
Solutions:
1. Check SDA/SCL connections (GPIO21/22)
2. Verify 3.3V power to sensors
3. Check ground connections
4. Try pull-up resistors (4.7kΩ) on SDA/SCL
```

#### DS18B20 Temperature Issues:
```
Symptoms: Temperature reads -127°C
Solutions:
1. Check OneWire connection (GPIO4)
2. Add 4.7kΩ pull-up resistor
3. Verify sensor isn't damaged
4. Check power connections
```

### WiFi Connection Issues:
```
Problem: ESP32 won't connect to WiFi
Solutions:
1. Check WiFi credentials (case-sensitive)
2. Ensure 2.4GHz network (not 5GHz)
3. Move closer to router
4. Check for special characters in password
```

## 📋 Component Shopping List

### Essential Components:
```
Microcontroller:
□ ESP32 DevKit V1                    ($8-12)
□ USB Cable (Micro-USB)              ($3-5)

Sensors:
□ MAX30102 Heart Rate Sensor         ($8-15)  
□ DS18B20 Temperature Sensor         ($3-5)
□ MPU6050 Accelerometer/Gyro         ($5-8)
□ SSD1306 OLED Display 128x64        ($8-12)

Components:
□ Active Buzzer 5V                   ($2-3)
□ LEDs (Red, Green)                  ($1-2)
□ Push Button                        ($1-2)
□ Resistors (220Ω, 4.7kΩ, 10kΩ)     ($2-5)
□ Breadboard                         ($5-8)
□ Jumper Wires (M-M, M-F)           ($5-10)

Optional:
□ GPS Module (NEO-6M)                ($12-20)
□ SIM800L GSM Module                 ($15-25)
□ PCB for permanent build            ($10-20)
```

### Total Estimated Cost: $50-100 USD

## 🎯 Next Steps

1. **Start Simple**: Begin with basic LED/button test
2. **Add Sensors**: Test each sensor individually  
3. **Test I2C**: Use I2C scanner to verify connections
4. **Upload Main Code**: Use the complete RescueNet firmware
5. **Test Communication**: Verify server connection
6. **Integration**: Test with web dashboard

Your hardware setup is now complete and ready for the RescueNet AI emergency monitoring system!
