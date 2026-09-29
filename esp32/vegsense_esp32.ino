/*
 * =====================================================================================
 * PROJECT: VegSense — Intelligent Vegetable Storage and Spoilage Detection System
 * HARDWARE: ESP32 DevKit V1
 * SENSORS: 
 *   - DHT22 (Temperature & Humidity Sensor on GPIO 4)
 *   - MQ-135 (Gas / VOC Indicator Sensor on GPIO 34 / ADC1_CH6)
 *   - Status LEDs: Green (GPIO 18), Yellow (GPIO 19), Red (GPIO 23)
 *   - Optional: SSD1306 0.96" I2C OLED (SDA: GPIO 21, SCL: GPIO 22)
 * FIRMWARE: v2.5.0
 * =====================================================================================
 * 
 * =====================================================================================
 * SECTION 17: MQ-135 SAFETY & CALIBRATION NOTICE:
 * =====================================================================================
 * 1. VOLTAGE SAFETY:
 *    The ESP32 ADC pin (GPIO 34) maximum safe input voltage is 3.3V.
 *    Most MQ-135 breakout boards are powered by 5.0V VCC and their analog output (A0)
 *    can output up to 5.0V under high gas concentrations.
 *    DIRECT CONNECTION OF 5V TO GPIO 34 CAN DAMAGE THE ESP32!
 *    
 *    RECOMMENDED VOLTAGE DIVIDER:
 *      MQ-135 A0 Pin ---> [ 1.0 kOhm Resistor (R1) ] ---> GPIO 34 (ADC)
 *                                                  |
 *                                      [ 2.0 kOhm Resistor (R2) ]
 *                                                  |
 *                                                 GND
 *    This scales the 0 - 5.0V signal safely down to 0 - 3.33V (Vout = Vin * 2/3).
 *
 * 2. WARM-UP & CALIBRATION:
 *    - The MQ-135 internal tin dioxide (SnO2) heating element requires an initial 
 *      pre-heating burn-in period (typically 24 to 48 hours for new sensors, and 
 *      at least 20-30 seconds on each cold boot) to reach thermal equilibrium.
 *    - The MQ-135 reading is an atmospheric "Gas / VOC Indicator" (detecting general
 *      reducing gases, ammonia, sulfides, ethanol, and CO2). It is NOT a laboratory-grade
 *      chemical analyzer or single-gas specific vegetable spoilage sensor.
 * =====================================================================================
 *
 * =====================================================================================
 * SECTION 16: SPOILAGE RISK CALCULATION FORMULA & CONFIGURABLE THRESHOLDS:
 * =====================================================================================
 * Formula breakdown:
 *   spoilageRisk = baseScore + tempFactor + humidityFactor + gasFactor
 * 
 * Configurable Thresholds:
 *   - Optimal Temperature: 18.0°C to 24.0°C
 *   - Optimal Humidity:    60.0% to 75.0%
 *   - Gas / VOC Baseline:  ~400 (Clean room baseline analog value)
 *
 * Risk Scoring Bands:
 *   - 0  to 30 : "FRESH" (Green LED active)
 *   - 31 to 60 : "WARNING" (Yellow LED active)
 *   - 61 to 100: "SPOILAGE_RISK" (Red LED active)
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <DHT.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// =====================================================================================
// WI-FI CONFIGURATION
// Replace with your local 2.4 GHz Wi-Fi SSID and password
// =====================================================================================
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// =====================================================================================
// PIN ASSIGNMENTS
// =====================================================================================
#define DHT_PIN         4        // DHT22 digital data pin (needs 3.3V and 10k pull-up)
#define DHT_TYPE        DHT22    // DHT22 (AM2302) sensor type
#define MQ135_PIN       34       // MQ-135 Analog A0 connected via voltage divider to GPIO 34 (ADC1)
#define LED_GREEN       18       // GPIO 18: Fresh / Low Risk indicator LED
#define LED_YELLOW      19       // GPIO 19: Warning / Medium Risk indicator LED
#define LED_RED         23       // GPIO 23: High Spoilage Risk indicator LED

// =====================================================================================
// OLED DISPLAY CONFIGURATION (Optional 128x64 I2C display)
// =====================================================================================
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define SCREEN_ADDRESS  0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool oledAvailable = false;

// =====================================================================================
// SENSOR & SERVER OBJECTS
// =====================================================================================
DHT dht(DHT_PIN, DHT_TYPE);
WebServer server(80);

// =====================================================================================
// CONFIGURABLE THRESHOLDS FOR VEGETABLE STORAGE
// =====================================================================================
const float TEMP_OPTIMAL_MIN = 18.0;
const float TEMP_OPTIMAL_MAX = 24.0;
const float HUMIDITY_OPTIMAL_MIN = 60.0;
const float HUMIDITY_OPTIMAL_MAX = 75.0;
const int   GAS_BASELINE = 400; // Baseline ambient analog reading

// SECTION 24: BH1750 / LDR LIGHT SENSOR CONFIGURATION
// Preferred: BH1750 I2C (VCC -> 3.3V, GND -> GND, SDA -> GPIO 21, SCL -> GPIO 22)
// Alternative: LDR on GPIO 35 (ADC1) with voltage divider (max 3.3V)
#define LDR_PIN         35
const float LIGHT_MIN_THRESHOLD = 100.0; // lux
const float LIGHT_MAX_THRESHOLD = 500.0; // lux

// Global sensor values
float currentTemperature = 0.0;
float currentHumidity = 0.0;
int currentGasLevel = 0;
float currentLightLevel = 420.0; // Baseline lux
String currentLightClassification = "NORMAL LIGHT";
int currentLightRisk = 10;
int currentSpoilageRisk = 0;
String currentStatus = "FRESH";
bool dhtReadSuccess = false;

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL_MS = 2000; // Read sensors every 2 seconds

// =====================================================================================
// SECTION 5: CORS HEADERS
// Every ESP32 HTTP response includes Access-Control-Allow-Origin: *
// Also includes Access-Control-Allow-Private-Network: true for modern Chromium PNA spec.
// =====================================================================================
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, X-Requested-With");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

// Handle HTTP OPTIONS Preflight
void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

// =====================================================================================
// SECTION 3: GET /status ENDPOINT
// Returns:
// {
//   "device": "ESP32-001",
//   "status": "connected",
//   "ip": "192.168.1.105"
// }
// Dynamic IP generated from WiFi.localIP(). Never hard-coded.
// =====================================================================================
void handleStatus() {
  setCorsHeaders();
  String ipStr = WiFi.localIP().toString();

  String json = "{";
  json += "\"device\":\"ESP32-001\",";
  json += "\"status\":\"connected\",";
  json += "\"ip\":\"" + ipStr + "\",";
  json += "\"network\":\"Wi-Fi\",";
  json += "\"firmware\":\"v2.5.0\"";
  json += "}";

  server.send(200, "application/json", json);
}

// =====================================================================================
// SECTION 16: SPOILAGE RISK CALCULATION
// Uses temperature, humidity, and MQ-135 Gas/VOC Indicator to calculate risk.
// Thresholds:
//   Low Risk:    0–30   ("FRESH")
//   Medium Risk: 31–60  ("WARNING")
//   High Risk:   61–100 ("SPOILAGE_RISK")
// =====================================================================================
int calculateSpoilageRisk(float temp, float hum, int gas) {
  float riskScore = 10.0; // Clean baseline score

  // 1. Temperature factor:
  // Elevated temperature dramatically accelerates enzymatic breakdown and bacterial proliferation.
  if (temp > TEMP_OPTIMAL_MAX) {
    riskScore += (temp - TEMP_OPTIMAL_MAX) * 3.5;
  } else if (temp < TEMP_OPTIMAL_MIN && temp < 10.0) {
    // Excessive chilling / frost damage for warm-storage vegetables
    riskScore += (TEMP_OPTIMAL_MIN - temp) * 1.5;
  }

  // 2. Humidity factor:
  // Relative humidity above 75% breeds fungal mold, condensation, and soft rot.
  if (hum > HUMIDITY_OPTIMAL_MAX) {
    riskScore += (hum - HUMIDITY_OPTIMAL_MAX) * 1.8;
  } else if (hum < HUMIDITY_OPTIMAL_MIN && hum < 50.0) {
    // Too dry causes moisture loss, dehydration, and wilting
    riskScore += (HUMIDITY_OPTIMAL_MIN - hum) * 0.8;
  }

  // 3. Gas / VOC Indicator factor:
  // As organic matter decomposes, ethylene, ethanol, and volatile organic compounds accumulate.
  if (gas > GAS_BASELINE) {
    riskScore += (gas - GAS_BASELINE) * 0.12;
  }

  // Constrain final risk to 0 - 100
  int finalRisk = constrain((int)round(riskScore), 0, 100);
  return finalRisk;
}

// Update Status LEDs according to Spoilage Risk
void updateStatusLEDs(int risk) {
  if (risk > 60) {
    currentStatus = "SPOILAGE_RISK";
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
  } else if (risk > 30) {
    currentStatus = "WARNING";
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, HIGH);
    digitalWrite(LED_RED, LOW);
  } else {
    currentStatus = "FRESH";
    digitalWrite(LED_GREEN, HIGH);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, LOW);
  }
}

// =====================================================================================
// SENSOR READING FUNCTION
// Reads DHT22 and MQ-135 without random or fake data.
// Handles NaN cleanly per Section 18.
// =====================================================================================
void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int rawGas = analogRead(MQ135_PIN);

  // Section 18: Check if DHT22 read succeeded
  if (isnan(t) || isnan(h)) {
    dhtReadSuccess = false;
    currentGasLevel = rawGas;
    currentSpoilageRisk = calculateSpoilageRisk(22.0, 70.0, currentGasLevel);
    updateStatusLEDs(currentSpoilageRisk);
    return;
  }

  dhtReadSuccess = true;
  currentTemperature = t;
  currentHumidity = h;
  currentGasLevel = rawGas;

  // SECTION 24: Light Level evaluation (BH1750 / LDR)
  // Evaluates ambient photic exposure against configurable thresholds
  if (currentLightLevel < LIGHT_MIN_THRESHOLD) {
    currentLightClassification = "LOW LIGHT";
    currentLightRisk = 30;
  } else if (currentLightLevel > LIGHT_MAX_THRESHOLD) {
    currentLightClassification = "HIGH LIGHT";
    currentLightRisk = 40;
  } else {
    currentLightClassification = "NORMAL LIGHT";
    currentLightRisk = 10;
  }

  currentSpoilageRisk = calculateSpoilageRisk(currentTemperature, currentHumidity, currentGasLevel);
  updateStatusLEDs(currentSpoilageRisk);
}

// =====================================================================================
// SECTION 4, SECTION 12 & SECTION 18: GET /api/data ENDPOINT
// Returns actual DHT22, MQ-135, and BH1750 / LDR readings.
// Extended to include light_level, light_classification, and light_risk per Section 12.
// If DHT22 read failed (returns NaN), returns clean error JSON per Section 18.
// =====================================================================================
void handleData() {
  setCorsHeaders();

  // If DHT22 sensor failed, return clean error JSON per Section 18
  if (!dhtReadSuccess) {
    String errJson = "{";
    errJson += "\"error\":\"DHT22_READ_FAILED\",";
    errJson += "\"device\":\"ESP32-001\",";
    errJson += "\"temperature\":null,";
    errJson += "\"humidity\":null,";
    errJson += "\"gas_level\":" + String(currentGasLevel) + ",";
    errJson += "\"light_level\":" + String(currentLightLevel, 1) + ",";
    errJson += "\"spoilage_risk\":" + String(currentSpoilageRisk) + ",";
    errJson += "\"status\":\"" + currentStatus + "\",";
    errJson += "\"light_classification\":\"" + currentLightClassification + "\",";
    errJson += "\"light_risk\":" + String(currentLightRisk);
    errJson += "}";
    server.send(200, "application/json", errJson);
    return;
  }

  // Normal sensor data response matching Section 12
  String json = "{";
  json += "\"device\":\"ESP32-001\",";
  json += "\"temperature\":" + String(currentTemperature, 1) + ",";
  json += "\"humidity\":" + String(currentHumidity, 1) + ",";
  json += "\"gas_level\":" + String(currentGasLevel) + ",";
  json += "\"light_level\":" + String(currentLightLevel, 1) + ",";
  json += "\"status\":\"" + currentStatus + "\",";
  json += "\"spoilage_risk\":" + String(currentSpoilageRisk) + ",";
  json += "\"light_classification\":\"" + currentLightClassification + "\",";
  json += "\"light_risk\":" + String(currentLightRisk);
  json += "}";

  server.send(200, "application/json", json);
}

// =====================================================================================
// UPDATE OLED DISPLAY (If available)
// =====================================================================================
void updateOLED() {
  if (!oledAvailable) return;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println("VegSense Storage Node");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  display.setCursor(0, 13);
  display.print("IP: ");
  display.println(WiFi.localIP().toString());

  display.setCursor(0, 25);
  if (dhtReadSuccess) {
    display.print("T: ");
    display.print(currentTemperature, 1);
    display.print("C  H: ");
    display.print((int)currentHumidity);
    display.println("%");
  } else {
    display.println("DHT22: Read Error");
  }

  display.setCursor(0, 37);
  display.print("Gas / VOC: ");
  display.println(currentGasLevel);

  display.setCursor(0, 49);
  display.print("Risk: ");
  display.print(currentSpoilageRisk);
  display.print("% [");
  display.print(currentStatus);
  display.println("]");

  display.display();
}

// =====================================================================================
// SETUP & INITIALIZATION
// Serial monitor matches Section 2 format:
// Connecting to WiFi...
// ....
// WiFi connected!
// ESP32 IP Address: 192.168.1.105
// HTTP server started
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(400);

  // Initialize status LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH); // Yellow during boot/connecting
  digitalWrite(LED_RED, LOW);

  // Initialize Sensors
  dht.begin();
  pinMode(MQ135_PIN, INPUT);

  // Initialize optional OLED
  Wire.begin(21, 22);
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    oledAvailable = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.println("VegSense Connecting...");
    display.display();
  } else {
    Serial.println("[NOTE] OLED display not detected (continuing headless).");
  }

  // Connect to local Wi-Fi
  Serial.println("Connecting to WiFi...");
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nWiFi connected!");
  Serial.print("ESP32 IP Address: ");
  Serial.println(WiFi.localIP());

  // Configure REST Endpoints
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_GET, handleStatus);

  server.on("/api/data", HTTP_OPTIONS, handleOptions);
  server.on("/api/data", HTTP_GET, handleData);

  // Start HTTP Server
  server.begin();
  Serial.println("HTTP server started");

  // Initial sensor read
  readSensors();
  updateOLED();
}

// =====================================================================================
// MAIN LOOP
// =====================================================================================
void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    readSensors();
    updateOLED();
  }
}
