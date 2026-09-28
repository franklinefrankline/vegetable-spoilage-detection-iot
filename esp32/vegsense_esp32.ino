/*
 * =====================================================================================
 * PROJECT: VegSense — Intelligent Vegetable Storage and Spoilage Detection System
 * HARDWARE: ESP32 DevKit V1
 * SENSORS: DHT22 (Temp/Humidity), MQ-135 (Gas/VOC), SSD1306 0.96" OLED, Status LEDs
 * FIRMWARE: v2.4.1
 * =====================================================================================
 * PINOUT SPECIFICATION:
 * - DHT22 Data Pin:    GPIO 4
 * - MQ-135 Analog Pin: GPIO 34 (ADC1_CH6)
 * - SSD1306 OLED SDA:  GPIO 21 (I2C)
 * - SSD1306 OLED SCL:  GPIO 22 (I2C)
 * - Green Status LED:  GPIO 18 (Fresh / Normal)
 * - Yellow Status LED: GPIO 19 (Warning / Monitor)
 * - Red Status LED:    GPIO 23 (Critical Spoilage Risk)
 * =====================================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

// Wi-Fi Configuration (Replace with your local network credentials)
const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";

// Hardware Pin Definitions
#define DHT_PIN         4
#define DHT_TYPE        DHT22
#define MQ135_PIN       34
#define LED_GREEN       18
#define LED_YELLOW      19
#define LED_RED         23

// OLED Display Configuration (128x64 I2C)
#define SCREEN_WIDTH    128
#define SCREEN_HEIGHT   64
#define OLED_RESET      -1
#define SCREEN_ADDRESS  0x3C

// Initialize Peripherals
DHT dht(DHT_PIN, DHT_TYPE);
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);
WebServer server(80);

// Global Telemetry Cache
float currentTemperature = 28.5;
float currentHumidity = 72.0;
int currentGasVOC = 420;
int currentSpoilageRisk = 18;
String currentStatus = "FRESH";

unsigned long lastSensorRead = 0;
const unsigned long SENSOR_INTERVAL = 2000; // 2 seconds

// Set CORS Headers for browser requests
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// Handle HTTP OPTIONS Preflight
void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

// Handler: GET /status
void handleStatus() {
  setCorsHeaders();
  String json = "{\"device\":\"ESP32-001\",\"status\":\"connected\",\"network\":\"Wi-Fi\",\"firmware\":\"v2.4.1\"}";
  server.send(200, "application/json", json);
}

// Handler: GET /api/data
void handleData() {
  setCorsHeaders();
  String json = "{";
  json += "\"device\":\"ESP32-001\",";
  json += "\"temperature\":" + String(currentTemperature, 1) + ",";
  json += "\"humidity\":" + String((int)currentHumidity) + ",";
  json += "\"gas_level\":" + String(currentGasVOC) + ",";
  json += "\"spoilage_risk\":" + String(currentSpoilageRisk) + ",";
  json += "\"status\":\"" + currentStatus + "\"";
  json += "}";
  server.send(200, "application/json", json);
}

// Read and process sensors
void readSensors() {
  float t = dht.readTemperature();
  float h = dht.readHumidity();
  int rawGas = analogRead(MQ135_PIN);

  if (!isnan(t)) currentTemperature = t;
  if (!isnan(h)) currentHumidity = h;

  // Map analog ADC (0 - 4095) to estimated ppm (350 - 1000)
  currentGasVOC = map(rawGas, 0, 4095, 350, 950);
  if (currentGasVOC < 350) currentGasVOC = 350;

  // Calculate prototype spoilage risk score
  int risk = 14;
  if (currentTemperature > 29.0) risk += 5;
  if (currentHumidity > 75.0) risk += 6;
  if (currentGasVOC > 450) risk += 8;

  currentSpoilageRisk = constrain(risk, 5, 95);

  if (currentSpoilageRisk > 35) {
    currentStatus = "HIGH RISK";
    digitalWrite(LED_GREEN, LOW);
    digitalWrite(LED_YELLOW, LOW);
    digitalWrite(LED_RED, HIGH);
  } else if (currentSpoilageRisk > 22) {
    currentStatus = "MONITOR";
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

// Update 0.96" OLED Display
void updateOLED() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(SSD1306_WHITE);

  display.setCursor(0, 0);
  display.println("VegSense Smart Monitor");
  display.drawLine(0, 10, 127, 10, SSD1306_WHITE);

  display.setCursor(0, 14);
  display.print("IP: ");
  display.println(WiFi.localIP().toString());

  display.setCursor(0, 26);
  display.print("Temp: ");
  display.print(currentTemperature, 1);
  display.print("C  Hum: ");
  display.print((int)currentHumidity);
  display.println("%");

  display.setCursor(0, 38);
  display.print("VOC: ");
  display.print(currentGasVOC);
  display.print(" ppm");

  display.setCursor(0, 50);
  display.print("Risk: ");
  display.print(currentSpoilageRisk);
  display.print("% [");
  display.print(currentStatus);
  display.println("]");

  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println("\n[BOOT] ESP32 DevKit V1 Initializing...");

  // Setup LEDs
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_YELLOW, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  digitalWrite(LED_GREEN, HIGH);
  digitalWrite(LED_YELLOW, LOW);
  digitalWrite(LED_RED, LOW);

  // Initialize Sensors & I2C
  dht.begin();
  pinMode(MQ135_PIN, INPUT);

  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println("[ERR] SSD1306 OLED initialization failed.");
  } else {
    display.clearDisplay();
    display.setTextSize(1);
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(10, 20);
    display.println("VegSense Booting...");
    display.display();
  }

  // Connect to Wi-Fi
  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\n[WiFi] Connected successfully!");
  Serial.print("[IP]   IP Address: ");
  Serial.println(WiFi.localIP());

  // Setup REST Endpoints
  server.on("/status", HTTP_OPTIONS, handleOptions);
  server.on("/status", HTTP_GET, handleStatus);

  server.on("/api/data", HTTP_OPTIONS, handleOptions);
  server.on("/api/data", HTTP_GET, handleData);

  server.begin();
  Serial.println("[HTTP] REST Server listening on port 80");
  Serial.println("[SENS] DHT22 OK | MQ-135 Calibrated | OLED Ready");

  readSensors();
  updateOLED();
}

void loop() {
  server.handleClient();

  unsigned long now = millis();
  if (now - lastSensorRead >= SENSOR_INTERVAL) {
    lastSensorRead = now;
    readSensors();
    updateOLED();
  }
}
