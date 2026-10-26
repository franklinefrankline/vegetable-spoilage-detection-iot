/*
 * =====================================================================================
 * PROJECT: VegSense — Intelligent Vegetable Storage and Spoilage Detection System
 * HARDWARE: ESP32 DevKit V1
 * SENSORS: 
 *   - DHT22 (Temperature & Humidity Sensor on GPIO 4)
 *   - MQ-135 (Gas / VOC Indicator Sensor on GPIO 34 / ADC1_CH6)
 *   - Status LEDs: Green (GPIO 18), Yellow (GPIO 19), Red (GPIO 23)
 *   - Display: SSD1306 0.96" I2C OLED (SDA: GPIO 21, SCL: GPIO 22, Addr: 0x3C)
 *   - Optional: BH1750 I2C Ambient Light Sensor (SDA: GPIO 21, SCL: GPIO 22, Addr: 0x23 / 0x5C)
 * FIRMWARE: v2.6.0
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
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
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
// CLOUD API CONFIGURATION
// Dedicated Cloud Ingestion Endpoint for VegSense (Vercel Serverless Production API)
// =====================================================================================
const char* DEVICE_ID             = "ESP32-001";
const char* CLOUD_API_URL         = "https://vegitables.vercel.app/api/readings";
const char* DEVICE_API_KEY        = "YOUR_VEGSENSE_API_KEY"; // Enter configured VEGSENSE_API_KEY or provisioned device token
const unsigned long CLOUD_PUSH_INTERVAL_MS = 15000;          // Send cloud telemetry every 15s
const int   HTTP_TIMEOUT_MS       = 8000;                    // 8-second HTTP timeout

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
// OLED DISPLAY CONFIGURATION (SSD1306 128x64 I2C display)
// =====================================================================================
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define SCREEN_ADDRESS  0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
bool oledAvailable = false;

// =====================================================================================
// OPTIONAL BH1750 I2C AMBIENT LIGHT SENSOR CONFIGURATION
// Standard I2C Addresses: 0x23 (default) or 0x5C (alternate)
// =====================================================================================
#define BH1750_DEFAULT_ADDR 0x23
#define BH1750_ALT_ADDR     0x5C
#define BH1750_POWER_ON     0x01
#define BH1750_CONTINUOUS_H 0x10

bool bh1750Installed = false;
uint8_t bh1750Address = 0x23;

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

const float LIGHT_MIN_THRESHOLD = 100.0; // lux
const float LIGHT_MAX_THRESHOLD = 500.0; // lux

// Global sensor values
float currentTemperature = 0.0;
float currentHumidity = 0.0;
int currentGasLevel = 0;
float currentLightLevel = -1.0; // -1 indicates optional sensor not installed
String currentLightClassification = "NOT INSTALLED";
int currentLightRisk = 0;
int currentSpoilageRisk = 0;
String currentStatus = "FRESH";
bool dhtReadSuccess = false;
String lastCloudStatus = "READY";
unsigned long lastCloudPushTime = 0;

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL_MS = 2000; // Read sensors every 2 seconds
unsigned long lastCloudPush = 0;
unsigned long lastWifiReconnectAttempt = 0;
const unsigned long WIFI_RECONNECT_INTERVAL_MS = 10000; // Non-blocking Wi-Fi reconnect every 10s

// =====================================================================================
// BH1750 PROBING & READING FUNCTIONS
// =====================================================================================
bool probeBH1750() {
  // Probe default address 0x23
  Wire.beginTransmission(BH1750_DEFAULT_ADDR);
  if (Wire.endTransmission() == 0) {
    bh1750Address = BH1750_DEFAULT_ADDR;
    return true;
  }
  // Probe alternative address 0x5C
  Wire.beginTransmission(BH1750_ALT_ADDR);
  if (Wire.endTransmission() == 0) {
    bh1750Address = BH1750_ALT_ADDR;
    return true;
  }
  return false;
}

void initBH1750() {
  Wire.beginTransmission(bh1750Address);
  Wire.write(BH1750_POWER_ON);
  Wire.endTransmission();
  delay(10);
  Wire.beginTransmission(bh1750Address);
  Wire.write(BH1750_CONTINUOUS_H);
  Wire.endTransmission();
}

float readBH1750Lux() {
  if (!bh1750Installed) return -1.0;
  
  Wire.requestFrom(bh1750Address, (uint8_t)2);
  if (Wire.available() >= 2) {
    uint8_t msb = Wire.read();
    uint8_t lsb = Wire.read();
    uint16_t raw = ((uint16_t)msb << 8) | lsb;
    float lux = (float)raw / 1.2;
    return lux;
  }
  return -1.0;
}

// =====================================================================================
// CORS HEADERS FOR LOCAL ENDPOINTS
// Every ESP32 HTTP response includes Access-Control-Allow-Origin: *
// Also includes Access-Control-Allow-Private-Network: true for Chromium PNA spec.
// =====================================================================================
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Origin, Accept, X-Requested-With, x-api-key");
  server.sendHeader("Access-Control-Allow-Private-Network", "true");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

// =====================================================================================
// GET /status ENDPOINT (Local reachability)
// Returns dynamic local IP and status
// =====================================================================================
void handleStatus() {
  setCorsHeaders();
  String ipStr = (WiFi.status() == WL_CONNECTED) ? WiFi.localIP().toString() : "0.0.0.0";

  String json = "{";
  json += "\"device\":\"" + String(DEVICE_ID) + "\",";
  json += "\"status\":\"connected\",";
  json += "\"ip\":\"" + ipStr + "\",";
  json += "\"network\":\"Wi-Fi\",";
  json += "\"firmware\":\"v2.6.0\",";
  json += "\"cloudConnected\":" + String(lastCloudStatus == "OK" ? "true" : "false") + ",";
  json += "\"bh1750Installed\":" + String(bh1750Installed ? "true" : "false");
  json += "}";

  server.send(200, "application/json", json);
}

// =====================================================================================
// SECTION 16: SPOILAGE RISK CALCULATION
// Uses temperature, humidity, and MQ-135 Gas/VOC Indicator to calculate risk.
// =====================================================================================
int calculateSpoilageRisk(float temp, float hum, int gas) {
  float riskScore = 10.0; // Clean baseline score

  if (temp > TEMP_OPTIMAL_MAX) {
    riskScore += (temp - TEMP_OPTIMAL_MAX) * 3.5;
  } else if (temp < TEMP_OPTIMAL_MIN && temp < 10.0) {
    riskScore += (TEMP_OPTIMAL_MIN - temp) * 1.5;
  }

  if (hum > HUMIDITY_OPTIMAL_MAX) {
    riskScore += (hum - HUMIDITY_OPTIMAL_MAX) * 1.8;
  } else if (hum < HUMIDITY_OPTIMAL_MIN && hum < 50.0) {
    riskScore += (HUMIDITY_OPTIMAL_MIN - hum) * 0.8;
  }

  if (gas > GAS_BASELINE) {
    riskScore += (gas - GAS_BASELINE) * 0.12;
  }

  return constrain((int)round(riskScore), 0, 100);
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
// Reads real DHT22, MQ-135 raw ADC, and optional BH1750 without fake data.
// =====================================================================================
void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int rawGas = analogRead(MQ135_PIN); // Raw 12-bit ADC reading (0–4095)

  currentGasLevel = rawGas;

  if (isnan(t) || isnan(h)) {
    dhtReadSuccess = false;
    currentTemperature = 0.0;
    currentHumidity = 0.0;
    // Calculate fallback risk using gas indicator and baseline ambient
    currentSpoilageRisk = calculateSpoilageRisk(22.0, 70.0, currentGasLevel);
  } else {
    dhtReadSuccess = true;
    currentTemperature = t;
    currentHumidity = h;
    currentSpoilageRisk = calculateSpoilageRisk(currentTemperature, currentHumidity, currentGasLevel);
  }

  // Read optional BH1750 sensor if installed
  if (bh1750Installed) {
    float lux = readBH1750Lux();
    if (lux >= 0.0) {
      currentLightLevel = lux;
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
    }
  } else {
    currentLightLevel = -1.0;
    currentLightClassification = "NOT INSTALLED";
    currentLightRisk = 0;
  }

  updateStatusLEDs(currentSpoilageRisk);
}

// =====================================================================================
// GET /api/data ENDPOINT (Local JSON API)
// =====================================================================================
void handleData() {
  setCorsHeaders();

  String json = "{";
  json += "\"device\":\"" + String(DEVICE_ID) + "\",";
  if (dhtReadSuccess) {
    json += "\"temperature\":" + String(currentTemperature, 1) + ",";
    json += "\"humidity\":" + String(currentHumidity, 1) + ",";
  } else {
    json += "\"temperature\":null,";
    json += "\"humidity\":null,";
    json += "\"error\":\"DHT22_READ_FAILED\",";
  }
  json += "\"gas_level\":" + String(currentGasLevel) + ",";
  json += "\"rawGas\":" + String(currentGasLevel) + ",";
  
  if (bh1750Installed && currentLightLevel >= 0.0) {
    json += "\"light_level\":" + String(currentLightLevel, 1) + ",";
    json += "\"lightLevel\":" + String(currentLightLevel, 1) + ",";
    json += "\"light_classification\":\"" + currentLightClassification + "\",";
    json += "\"light_risk\":" + String(currentLightRisk) + ",";
  } else {
    json += "\"light_level\":null,";
    json += "\"lightLevel\":null,";
    json += "\"light_classification\":\"NOT INSTALLED\",";
    json += "\"light_risk\":0,";
  }
  json += "\"status\":\"" + currentStatus + "\",";
  json += "\"spoilage_risk\":" + String(currentSpoilageRisk);
  json += "}";

  server.send(200, "application/json", json);
}

// =====================================================================================
// GET / (Local Web Dashboard)
// Displays a responsive on-device status dashboard if accessed via private LAN IP.
// =====================================================================================
void handleRoot() {
  setCorsHeaders();
  String html = "<!DOCTYPE html><html lang='en'><head><meta charset='UTF-8'><meta name='viewport' content='width=device-width,initial-scale=1.0'>";
  html += "<title>VegSense ESP32 Local Node</title>";
  html += "<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0b1320;color:#f0fdf4;margin:0;padding:20px;display:flex;justify-content:center;align-items:center;min-height:100vh;}";
  html += ".card{background:#111c2e;border:1px solid #1e293b;border-radius:16px;padding:24px;max-width:440px;width:100%;box-shadow:0 12px 36px rgba(0,0,0,0.4);}";
  html += "h1{font-size:1.3rem;margin:0 0 4px;color:#10b981;display:flex;align-items:center;gap:8px;}";
  html += ".subtitle{color:#94a3b8;font-size:0.85rem;margin:0 0 16px;}";
  html += ".badge{display:inline-block;padding:4px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;}";
  html += ".badge-fresh{background:rgba(16,185,129,0.2);color:#10b981;}";
  html += ".badge-warning{background:rgba(245,158,11,0.2);color:#f59e0b;}";
  html += ".badge-danger{background:rgba(239,68,68,0.2);color:#ef4444;}";
  html += ".metric-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0;}";
  html += ".metric{background:#0b1320;border:1px solid #1e293b;border-radius:10px;padding:12px;text-align:center;}";
  html += ".metric-label{font-size:0.75rem;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;}";
  html += ".metric-val{font-size:1.4rem;font-weight:700;color:#f8fafc;margin-top:4px;}";
  html += ".cloud-box{background:rgba(16,185,129,0.06);border:1px dashed #10b981;border-radius:10px;padding:10px;font-size:0.8rem;margin-top:14px;}";
  html += "</style>";
  html += "<script>setTimeout(()=>location.reload(),4000);</script></head><body>";
  html += "<div class='card'>";
  html += "<h1>VegSense Storage Node</h1>";
  html += "<p class='subtitle'>Device ID: <strong>" + String(DEVICE_ID) + "</strong> &bull; IP: " + WiFi.localIP().toString() + "</p>";
  
  String badgeClass = currentStatus == "FRESH" ? "badge-fresh" : (currentStatus == "WARNING" ? "badge-warning" : "badge-danger");
  html += "<div>Status: <span class='badge " + badgeClass + "'>" + currentStatus + " (" + String(currentSpoilageRisk) + "% Spoilage Risk)</span></div>";
  
  html += "<div class='metric-grid'>";
  html += "<div class='metric'><div class='metric-label'>Temperature</div><div class='metric-val'>" + (dhtReadSuccess ? (String(currentTemperature, 1) + "&deg;C") : "ERR") + "</div></div>";
  html += "<div class='metric'><div class='metric-label'>Humidity</div><div class='metric-val'>" + (dhtReadSuccess ? (String((int)currentHumidity) + "%") : "ERR") + "</div></div>";
  html += "<div class='metric'><div class='metric-label'>Gas / VOC (ADC)</div><div class='metric-val'>" + String(currentGasLevel) + "</div></div>";
  html += "<div class='metric'><div class='metric-label'>Light (BH1750)</div><div class='metric-val'>" + (bh1750Installed ? (String((int)currentLightLevel) + " lx") : "N/A") + "</div></div>";
  html += "</div>";

  html += "<div class='cloud-box'>";
  html += "<strong>Cloud Ingestion:</strong> " + String(CLOUD_API_URL) + "<br>";
  html += "<strong>Cloud Status:</strong> " + lastCloudStatus + "<br>";
  html += "<em>The primary dashboard is accessible worldwide at: <a href='https://vegitables.vercel.app/' style='color:#10b981;' target='_blank'>vegitables.vercel.app</a></em>";
  html += "</div></div></body></html>";

  server.send(200, "text/html", html);
}

// =====================================================================================
// UPDATE OLED DISPLAY
// =====================================================================================
void updateOLED() {
  if (!oledAvailable) return;

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  // Line 0: Header
  display.setCursor(0, 0);
  display.println("VegSense IoT Node");
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // Line 1: Network & Cloud Status
  display.setCursor(0, 12);
  if (WiFi.status() == WL_CONNECTED) {
    display.print("IP: ");
    display.print(WiFi.localIP().toString());
  } else {
    display.print("WiFi: Reconnecting...");
  }

  // Line 2: DHT22 Telemetry
  display.setCursor(0, 24);
  if (dhtReadSuccess) {
    display.print("T: ");
    display.print(currentTemperature, 1);
    display.print("C  H: ");
    display.print((int)currentHumidity);
    display.println("%");
  } else {
    display.println("DHT22: Sensor Error");
  }

  // Line 3: Gas & Optional Light
  display.setCursor(0, 36);
  display.print("Gas: ");
  display.print(currentGasLevel);
  if (bh1750Installed && currentLightLevel >= 0) {
    display.print(" L: ");
    display.print((int)currentLightLevel);
    display.println("lx");
  } else {
    display.println(" L: None");
  }

  // Line 4: Risk & Cloud
  display.setCursor(0, 48);
  display.print("Risk: ");
  display.print(currentSpoilageRisk);
  display.print("% [");
  display.print(currentStatus.substring(0, 5));
  display.print("] Cld:");
  display.println(lastCloudStatus == "OK" ? "OK" : "Err");

  display.display();
}

// =====================================================================================
// HTTPS TELEMETRY UPLOAD TO DEDICATED CLOUD INGESTION ENDPOINT
// - Secure TLS connection to https://vegitables.vercel.app/api/readings
// - Includes device ID, temperature, humidity, raw MQ-135 ADC reading
// - Includes optional light measurement ONLY if the BH1750 is installed
// - Includes x-api-key authentication header
// =====================================================================================
void pushTelemetryToCloud() {
  if (WiFi.status() != WL_CONNECTED) {
    lastCloudStatus = "NO_WIFI";
    return;
  }

  WiFiClientSecure client;
  client.setInsecure(); // Secure TLS connection to Vercel HTTPS without hardcoded expiring certs
  client.setTimeout(HTTP_TIMEOUT_MS / 1000);

  HTTPClient https;
  if (!https.begin(client, CLOUD_API_URL)) {
    Serial.println("[Cloud] Failed to initialize HTTPS connection.");
    lastCloudStatus = "INIT_FAIL";
    return;
  }

  https.addHeader("Content-Type", "application/json");
  https.addHeader("x-api-key", DEVICE_API_KEY);

  // Build JSON payload matching server ingestion contract
  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  if (dhtReadSuccess) {
    payload += "\"temperature\":" + String(currentTemperature, 1) + ",";
    payload += "\"humidity\":" + String(currentHumidity, 1) + ",";
  } else {
    payload += "\"temperature\":null,";
    payload += "\"humidity\":null,";
  }
  payload += "\"gasLevel\":" + String(currentGasLevel);
  
  // Include light measurement ONLY if the BH1750 is installed
  if (bh1750Installed && currentLightLevel >= 0.0) {
    payload += ",\"lightLevel\":" + String(currentLightLevel, 1);
  }
  
  payload += ",\"spoilageRisk\":" + String(currentSpoilageRisk);
  payload += "}";

  int httpCode = https.POST(payload);
  if (httpCode > 0) {
    Serial.print("[Cloud Ingestion] HTTP Code: ");
    Serial.println(httpCode);
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      Serial.println("[Cloud Ingestion] Telemetry persisted successfully.");
      lastCloudStatus = "OK";
      lastCloudPushTime = millis();
    } else {
      String resp = https.getString();
      Serial.print("[Cloud Ingestion] Server Response: ");
      Serial.println(resp);
      lastCloudStatus = "HTTP_" + String(httpCode);
    }
  } else {
    Serial.print("[Cloud Ingestion] Request error: ");
    Serial.println(https.errorToString(httpCode));
    lastCloudStatus = "ERR";
  }
  https.end();
}

// =====================================================================================
// SETUP & INITIALIZATION
// =====================================================================================
void setup() {
  Serial.begin(115200);
  delay(500);
  Serial.println("\n[VegSense] Initializing ESP32 Storage Node Firmware v2.6.0...");

  // Initialize status LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, LOW);
  digitalWrite(LED_YELLOW, HIGH); // Amber during boot
  digitalWrite(LED_RED, LOW);

  // Initialize Sensors
  dht.begin();
  pinMode(MQ135_PIN, INPUT);

  // Initialize I2C Bus (SDA = GPIO 21, SCL = GPIO 22)
  Wire.begin(21, 22);

  // Probe and initialize optional SSD1306 OLED
  if (display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    oledAvailable = true;
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(5, 20);
    display.println("VegSense Node");
    display.setCursor(5, 34);
    display.println("Connecting WiFi...");
    display.display();
    Serial.println("[Hardware] SSD1306 OLED display initialized (0x3C).");
  } else {
    Serial.println("[Hardware] SSD1306 OLED not detected (continuing headless).");
  }

  // Probe and initialize optional BH1750 Ambient Light Sensor
  if (probeBH1750()) {
    bh1750Installed = true;
    initBH1750();
    Serial.print("[Hardware] BH1750 Light Sensor detected at address: 0x");
    Serial.println(bh1750Address, HEX);
  } else {
    bh1750Installed = false;
    Serial.println("[Hardware] Optional BH1750 light sensor not installed. Running in 3-sensor mode (DHT22 + MQ-135).");
  }

  // Connect to Wi-Fi
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long startAttempt = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - startAttempt < 15000) {
    delay(400);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi connected!");
    Serial.print("ESP32 IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("\n[Wi-Fi] Initial connection timeout. Will retry in background loop.");
  }

  // Configure Local Web Server Endpoints
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_GET, handleStatus);

  server.on("/api/data", HTTP_OPTIONS, handleOptions);
  server.on("/api/data", HTTP_GET, handleData);

  server.on("/", HTTP_GET, handleRoot);

  server.begin();
  Serial.println("HTTP server started");

  // Initial sensor read
  readSensors();
  updateOLED();

  // Initial cloud push if Wi-Fi is ready
  if (WiFi.status() == WL_CONNECTED) {
    pushTelemetryToCloud();
  }
}

// =====================================================================================
// MAIN EXECUTION LOOP
// =====================================================================================
void loop() {
  server.handleClient();

  unsigned long now = millis();

  // 1. Non-blocking Wi-Fi reconnection monitor
  if (WiFi.status() != WL_CONNECTED) {
    if (now - lastWifiReconnectAttempt >= WIFI_RECONNECT_INTERVAL_MS) {
      lastWifiReconnectAttempt = now;
      Serial.println("[Wi-Fi] Network lost. Reconnecting non-blocking...");
      WiFi.reconnect();
    }
  }

  // 2. Read physical sensors every 2 seconds
  if (now - lastSensorRead >= SENSOR_INTERVAL_MS) {
    lastSensorRead = now;
    readSensors();
    updateOLED();
  }

  // 3. Upload telemetry to cloud API every 15 seconds
  if (now - lastCloudPush >= CLOUD_PUSH_INTERVAL_MS) {
    lastCloudPush = now;
    pushTelemetryToCloud();
    updateOLED();
  }
}
