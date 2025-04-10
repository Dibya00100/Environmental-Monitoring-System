#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// OLED display settings
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET    -1
#define SCREEN_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// WiFi parameters
#define WLAN_SSID       "KAMI"
#define WLAN_PASS       "toradora"

// Web server settings
const char* serverName = "http://192.168.0.102:3000"; // Your computer's IP address
const char* apiEndpoint = "/api/sensor-data";

// Sensor pins
#define DHTPIN 21
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);

#define MQ136_PIN 1 // MQ-136 sensor connected to GPIO34

void setup() {
  Serial.begin(115200);
  Wire.begin(19, 18); // SDA -> GPIO19, SCL -> GPIO18

  if (!display.begin(SSD1306_SWITCHCAPVCC, SCREEN_ADDRESS)) {
    Serial.println(F("SSD1306 allocation failed"));
    for (;;);
  }
  displayStartupMessage();
  
  Serial.println(F("Connecting to WiFi"));
  WiFi.begin(WLAN_SSID, WLAN_PASS);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected!");
  displayConnectingMessage();
  
  dht.begin();
}

void displayStartupMessage() {
  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);
  display.setCursor(10, 10);
  display.println("Environmental");
  display.setCursor(10, 20);
  display.println("Monitoring System");
  display.setCursor(10, 30);
  display.println("Home Version");
  display.setCursor(10, 40);
  display.println("Activating...");
  display.display();
  delay(2000);
}

void displayConnectingMessage() {
  display.clearDisplay();
  display.setCursor(10, 10);
  display.println("Connecting to");
  display.setCursor(10, 20);
  display.println("server...");
  display.display();
  delay(2000);
}

void displayData(float temp, float hum, int airQuality) {
  display.clearDisplay();
  display.setTextSize(1);
  display.setCursor(0, 10);
  display.println("Temp:");
  display.setCursor(50, 10);
  display.setTextSize(2);
  display.print(temp);
  display.println(" C");

  display.setTextSize(1);
  display.setCursor(0, 35);
  display.println("Hum:");
  display.setCursor(50, 35);
  display.setTextSize(2);
  display.print(hum);
  display.println(" %");

  display.setTextSize(1);
  display.setCursor(0, 55);
  display.println("Air Q:");
  display.setCursor(50, 55);
  display.setTextSize(2);
  display.print(airQuality);
  display.display();
}

void sendDataToServer(float temp, float hum, int airQuality) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    // Validate sensor readings
    if (isnan(temp) || isnan(hum)) {
      Serial.println("Invalid sensor readings, skipping send");
      return;
    }
    
    // Create JSON document
    StaticJsonDocument<200> doc;
    doc["temperature"] = round(temp * 10) / 10.0; // Round to 1 decimal place
    doc["humidity"] = round(hum * 10) / 10.0;     // Round to 1 decimal place
    doc["airQuality"] = airQuality;
    doc["soilMoisture"] = 0;
    doc["deviceId"] = "ESP32_EMS";  // Add device identifier
    doc["timestamp"] = millis();     // Add timestamp
    
    String jsonString;
    serializeJson(doc, jsonString);
    
    // Print debug information
    Serial.println("\n=== Attempting to send data ===");
    Serial.println("Server URL: " + String(serverName) + String(apiEndpoint));
    Serial.println("WiFi Status: " + String(WiFi.status()));
    Serial.println("Local IP: " + WiFi.localIP().toString());
    Serial.println("Gateway IP: " + WiFi.gatewayIP().toString());
    Serial.println("Signal Strength: " + String(WiFi.RSSI()) + " dBm");
    Serial.println("Data: " + jsonString);
    
    // Configure HTTP request
    http.begin(serverName + String(apiEndpoint));
    http.addHeader("Content-Type", "application/json");
    http.addHeader("User-Agent", "ESP32-EMS");
    
    // Send HTTP POST request with retry
    int maxRetries = 3;
    int retryCount = 0;
    int httpResponseCode = -1;
    
    while (retryCount < maxRetries && httpResponseCode <= 0) {
      Serial.println("Attempt " + String(retryCount + 1) + " of " + String(maxRetries));
      httpResponseCode = http.POST(jsonString);
      
      if (httpResponseCode > 0) {
        String response = http.getString();
        Serial.println("HTTP Response code: " + String(httpResponseCode));
        Serial.println("Response: " + response);
        break; // Success, exit retry loop
      } else {
        Serial.println("Error code: " + String(httpResponseCode));
        Serial.println("Error: " + http.errorToString(httpResponseCode));
        retryCount++;
        delay(1000);
      }
    }
    
    http.end();
    
    if (httpResponseCode <= 0) {
      Serial.println("All retry attempts failed");
      Serial.println("Trying to reconnect to WiFi...");
      WiFi.disconnect();
      delay(1000);
      WiFi.begin(WLAN_SSID, WLAN_PASS);
      delay(5000);
    }
  } else {
    Serial.println("WiFi Disconnected - Attempting to reconnect");
    WiFi.begin(WLAN_SSID, WLAN_PASS);
    delay(5000);
  }
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Reconnecting to WiFi...");
    WiFi.begin(WLAN_SSID, WLAN_PASS);
    delay(5000);
    return;
  }
  
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();
  int airQuality = analogRead(MQ136_PIN);

  // Check if any reads failed and exit early
  if (isnan(temp) || isnan(hum)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }

  Serial.print("Temperature: "); Serial.print(temp); Serial.print("°C, ");
  Serial.print("Humidity: "); Serial.print(hum); Serial.print("%, ");
  Serial.print("Air Quality: "); Serial.println(airQuality);

  displayData(temp, hum, airQuality);
  sendDataToServer(temp, hum, airQuality);
  
  delay(5000); // Wait 5 seconds before next reading
} 