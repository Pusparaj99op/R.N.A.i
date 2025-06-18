# Visual Connection Diagrams for RescueNet AI

## 🔌 ESP32 Complete Wiring Diagram

```
                    ESP32 DevKit V1 Board
                   ┌─────────────────────┐
                   │ 3V3 ●────────────● VIN │ ← 5V Power Input
                   │ GND ●────────────● GND │ ← Ground
                   │ D2  ●────────────● D13 │
                   │ D4  ●────────────● D12 │
                   │ D16 ●────────────● D14 │
                   │ D17 ●────────────● D27 │
                   │ D5  ●────────────● D26 │
                   │ D18 ●────────────● D25 │
                   │ D19 ●────────────● D33 │
                   │ D21 ●────────────● D32 │ 
                   │ D22 ●────────────● D35 │
                   │ D23 ●────────────● D34 │
                   └─────────────────────┘
                            │  USB  │
                            └───────┘

Power Distribution:
3V3 (Pin) ──┬── All Sensor VCC pins (Red wires)
            ├── MAX30102 VCC
            ├── MPU6050 VCC  
            ├── SSD1306 VCC
            └── DS18B20 VCC

GND (Pin) ──┬── All Sensor GND pins (Black wires)
            ├── MAX30102 GND
            ├── MPU6050 GND
            ├── SSD1306 GND
            ├── DS18B20 GND
            ├── Buzzer (-)
            └── Button (one side)

I2C Bus:
D21 (SDA) ──┬── All I2C Device SDA pins (Blue wires)
            ├── MAX30102 SDA
            ├── MPU6050 SDA
            └── SSD1306 SDA

D22 (SCL) ──┬── All I2C Device SCL pins (Yellow wires)
            ├── MAX30102 SCL
            ├── MPU6050 SCL
            └── SSD1306 SCL

Individual Connections:
D2  ── Buzzer (+) [White wire]
D4  ── DS18B20 Data [Orange wire] + 4.7kΩ pullup to 3V3
D5  ── Status LED (+) [Green wire] + 220Ω resistor to GND
D18 ── Emergency LED (+) [Red wire] + 220Ω resistor to GND
D0  ── Emergency Button [Purple wire] (other side to GND)
```

## 🔌 Arduino Nano Complete Wiring Diagram

```
                    Arduino Nano Board
                   ┌─────────────────────┐
                   │ D12 ●          ● D13 │ ← Built-in LED
                   │ D11 ●          ● A0  │
                   │ D10 ●          ● A1  │
                   │ D9  ●          ● A2  │
                   │ D8  ●          ● A3  │
                   │ D7  ●          ● A4  │ ← SDA (I2C Data)
                   │ D6  ●          ● A5  │ ← SCL (I2C Clock)
                   │ D5  ●          ● A6  │
                   │ D4  ●          ● A7  │
                   │ D3  ●          ● 5V  │ ← 5V Power Output
                   │ D2  ●          ● GND │ ← Ground
                   │ RST ●          ● RST │
                   │ GND ●          ● VIN │ ← 7-12V Power Input
                   └─────────────────────┘
                            │  USB  │
                            └───────┘

Power Distribution:
5V (Pin) ───┬── All Sensor VCC pins (Red wires)
           │   (Note: Some sensors need 3.3V - use voltage divider)
           ├── ESP8266 VCC (3.3V via regulator)
           └── Other 5V components

GND (Pin) ──┬── All Sensor GND pins (Black wires)
            ├── All component GND connections
            └── ESP8266 GND

I2C Bus:
A4 (SDA) ───┬── All I2C Device SDA pins (Blue wires)
            ├── MAX30102 SDA
            ├── MPU6050 SDA
            └── SSD1306 SDA

A5 (SCL) ───┬── All I2C Device SCL pins (Yellow wires)
            ├── MAX30102 SCL
            ├── MPU6050 SCL
            └── SSD1306 SCL

Individual Connections:
D2  ── Emergency Button (interrupt pin) [Purple wire]
D4  ── DS18B20 Data [Orange wire] + 4.7kΩ pullup to VCC
D5  ── Status LED (+) [Green wire] + 220Ω resistor to GND
D6  ── Emergency LED (+) [Red wire] + 220Ω resistor to GND
D7  ── Buzzer (+) [White wire]
D8  ── ESP8266 RX [WiFi communication]
D9  ── ESP8266 TX [WiFi communication]
```

## 📟 Sensor-Specific Wiring

### MAX30102 Heart Rate Sensor
```
MAX30102 Module     ESP32/Nano
┌─────────────┐     ┌──────────┐
│ VCC     ●───┼─────┤ 3V3/5V   │
│ GND     ●───┼─────┤ GND      │
│ SDA     ●───┼─────┤ D21/A4   │
│ SCL     ●───┼─────┤ D22/A5   │
│ INT     ●   │     │          │ (optional)
└─────────────┘     └──────────┘

I2C Address: 0x57
```

### DS18B20 Temperature Sensor
```
DS18B20 (TO-92 Package)
     ┌─────┐
     │  1  │ ← GND (Black)
     │  2  │ ← Data (Orange) + 4.7kΩ pullup to VCC
     │  3  │ ← VCC (Red)
     └─────┘
       │ │ │
       │ │ └── 3V3/5V
       │ └──── GPIO4 (ESP32) / D4 (Nano)
       └────── GND

Pullup Resistor:
4.7kΩ resistor between Data pin and VCC pin
```

### MPU6050 Accelerometer/Gyroscope
```
MPU6050 Module      ESP32/Nano
┌─────────────┐     ┌──────────┐
│ VCC     ●───┼─────┤ 3V3/5V   │
│ GND     ●───┼─────┤ GND      │
│ SDA     ●───┼─────┤ D21/A4   │
│ SCL     ●───┼─────┤ D22/A5   │
│ XDA     ●   │     │          │ (not used)
│ XCL     ●   │     │          │ (not used)
│ AD0     ●───┼─────┤ GND      │ (for 0x68 address)
│ INT     ●   │     │          │ (optional)
└─────────────┘     └──────────┘

I2C Address: 0x68 (AD0 to GND) or 0x69 (AD0 to VCC)
```

### SSD1306 OLED Display
```
SSD1306 128x64      ESP32/Nano
┌─────────────┐     ┌──────────┐
│ VCC     ●───┼─────┤ 3V3/5V   │
│ GND     ●───┼─────┤ GND      │
│ SDA     ●───┼─────┤ D21/A4   │
│ SCL     ●───┼─────┤ D22/A5   │
└─────────────┘     └──────────┘

I2C Address: 0x3C or 0x3D
```

## 🔔 Status Indicators & Controls

### Status LEDs
```
Status LED (Green):
ESP32 D5 ──[220Ω]──[LED+]──[LED-]── GND
Nano D5  ──[220Ω]──[LED+]──[LED-]── GND

Emergency LED (Red):
ESP32 D18 ──[220Ω]──[LED+]──[LED-]── GND
Nano D6   ──[220Ω]──[LED+]──[LED-]── GND

LED Connection:
        220Ω Resistor
GPIO ────[resistor]────[LED Anode (+)]────[LED Cathode (-)]──── GND
                              │                      │
                           Long leg              Short leg
```

### Buzzer Connection
```
Active Buzzer:
ESP32 D2 ──── Buzzer (+) [Red wire]
GND      ──── Buzzer (-) [Black wire]

Nano D7  ──── Buzzer (+) [Red wire]  
GND      ──── Buzzer (-) [Black wire]

Passive Buzzer (if using):
Add 100Ω resistor in series with positive connection
```

### Emergency Button
```
ESP32 Button Connection:
D0 ────[Button]──── GND
   │
   └── Internal Pull-up enabled in code

Nano Button Connection:
D2 ────[Button]──── GND
   │
   └── Internal Pull-up enabled in code

Button wiring:
GPIO Pin ────● ●──── GND
             │ │
        [Button Contacts]
        
When pressed: GPIO reads LOW (0)
When released: GPIO reads HIGH (1) due to internal pull-up
```

## 🔧 Breadboard Layout

### Complete Breadboard Setup
```
                    Breadboard Layout
    a b c d e   f g h i j     Power Rails
    1 + + + +   + + + + +  1  ←── [+] Red Rail (3V3/5V)
    2 + + + +   + + + + +  2  ←── [-] Blue Rail (GND)
    3 + + + +   + + + + +  3
    4 + + + +   + + + + +  4
    5 + + + +   + + + + +  5
    ...
   30 + + + +   + + + + + 30

Component Placement:
Row 1-5:   ESP32/Nano (if using breadboard adapter)
Row 6-10:  MAX30102 Heart Rate Sensor
Row 11-15: MPU6050 Accelerometer
Row 16-20: SSD1306 OLED Display
Row 21-25: DS18B20 Temperature Sensor + Pullup resistor
Row 26-30: LEDs with resistors, Buzzer, Button

Power Rails:
[+] Rail connects to: ESP32 3V3 pin (Red wire)
[-] Rail connects to: ESP32 GND pin (Black wire)

Common Buses:
SDA Bus (Blue): Row 40-45 (connect all SDA pins here)
SCL Bus (Yellow): Row 46-50 (connect all SCL pins here)
```

### Wire Color Coding
```
Red    ── VCC/Power (3.3V or 5V)
Black  ── GND/Ground  
Blue   ── SDA (I2C Data)
Yellow ── SCL (I2C Clock)
Orange ── DS18B20 Data
Green  ── Status LED
Red    ── Emergency LED  
White  ── Buzzer
Purple ── Emergency Button
```

## 🧪 Testing Connections

### Step-by-Step Testing

#### 1. Power Test
```cpp
// Upload this code to test power connections:
void setup() {
  Serial.begin(115200);
  Serial.println("Power test - should see this message");
}

void loop() {
  Serial.println("System running...");
  delay(1000);
}
```

#### 2. LED Test  
```cpp
void setup() {
  pinMode(5, OUTPUT);   // Status LED (ESP32 D5 / Nano D5)
  pinMode(18, OUTPUT);  // Emergency LED (ESP32 D18 / Nano D6)
}

void loop() {
  digitalWrite(5, HIGH);   // Status LED ON
  digitalWrite(18, LOW);   // Emergency LED OFF
  delay(500);
  
  digitalWrite(5, LOW);    // Status LED OFF  
  digitalWrite(18, HIGH);  // Emergency LED ON
  delay(500);
}
```

#### 3. Button Test
```cpp
void setup() {
  pinMode(0, INPUT_PULLUP);  // ESP32 D0 / Nano D2
  Serial.begin(115200);
}

void loop() {
  if (digitalRead(0) == LOW) {
    Serial.println("Button pressed!");
    delay(200);
  }
}
```

#### 4. I2C Scanner
```cpp
#include <Wire.h>

void setup() {
  Wire.begin(21, 22);  // ESP32: SDA=21, SCL=22
  // Wire.begin();     // Nano: SDA=A4, SCL=A5
  Serial.begin(115200);
  Serial.println("I2C Scanner");
}

void loop() {
  for (byte address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    byte error = Wire.endTransmission();
    
    if (error == 0) {
      Serial.print("I2C device found at address 0x");
      Serial.println(address, HEX);
    }
  }
  delay(5000);
}

Expected results:
0x3C - SSD1306 OLED Display
0x57 - MAX30102 Heart Rate Sensor
0x68 - MPU6050 Accelerometer
```

## 🔧 Common Issues & Solutions

### Problem: No I2C devices found
```
Solutions:
1. Check SDA/SCL connections (ESP32: D21/D22, Nano: A4/A5)
2. Verify 3.3V/5V power to sensors
3. Check ground connections
4. Try adding 4.7kΩ pull-up resistors on SDA/SCL lines
5. Use multimeter to verify voltage at sensor pins
```

### Problem: Temperature reads -127°C
```
Solutions:
1. Check DS18B20 data connection (ESP32: D4, Nano: D4)
2. Verify 4.7kΩ pull-up resistor between data and VCC
3. Check power and ground connections
4. Try different DS18B20 sensor (may be damaged)
```

### Problem: Heart rate not detected
```
Solutions:
1. Check MAX30102 I2C connections
2. Ensure finger placement on sensor
3. Check sensor power (3.3V)
4. Try different I2C address (0x57)
5. Clean sensor surface
```

### Problem: Display not working
```
Solutions:
1. Check I2C address (0x3C or 0x3D)
2. Verify power connections (3.3V or 5V depending on module)
3. Check SDA/SCL connections
4. Try different OLED module
```

## 📱 SIM800L GSM Module Wiring

### Complete SIM800L Integration

```
ESP32 DevKit ←→ SIM800L Module
┌─────────────────────┐    ┌──────────────────┐
│ 3.3V ●──────────────────→ VCC ⚠️ WARNING    │
│ GND  ●──────────────────→ GND (3.7V-4.2V   │
│ D16  ●──────────────────→ RXD ONLY!)        │
│ D17  ●←─────────────────→ TXD               │
│ D14  ●──────────────────→ RST               │
│ D15  ●──────────────────→ PWR               │
└─────────────────────┘    └──────────────────┘
                                    │
                               [📶 Antenna]
                                    │
                           [💳 SIM Card Slot]
```

### SIM800L Power Supply Options

#### Option 1: External 3.7V Battery (Recommended)
```
3.7V Li-Ion ─┬─→ SIM800L VCC
             └─→ ESP32 VIN (through regulator)
GND ─────────┬─→ SIM800L GND  
             └─→ ESP32 GND
```

#### Option 2: Buck Converter from 5V
```
5V ─→ [Buck Converter] ─→ 3.8V ─→ SIM800L VCC
GND ─→ [Buck Converter] ─→ GND ─→ SIM800L GND
```

#### Option 3: Voltage Divider (Emergency Only)
```
3.3V ─┬─[100Ω]─┬─→ SIM800L VCC (~3.1V)
      │         │
      └─[4.7µF]─┴─→ SIM800L GND
```

### SIM800L Connection Details

| ESP32 Pin | SIM800L Pin | Function | Wire Color |
|-----------|-------------|----------|------------|
| 3.3V*     | VCC         | Power    | Red        |
| GND       | GND         | Ground   | Black      |
| D16       | RXD         | Data RX  | Blue       |
| D17       | TXD         | Data TX  | Green      |
| D14       | RST         | Reset    | Yellow     |
| D15       | PWR         | Power Ctrl| Orange    |

*Use external 3.7V supply for best results

This comprehensive wiring guide should help you successfully connect and test your RescueNet AI hardware components!
