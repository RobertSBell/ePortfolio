/*
 * Thermostat - Arduino UNO R4 WiFi Port
 *
 * Functionality:
 *
 * The thermostat has three states:
 *   OFF
 *   HEAT
 *   COOL
 *
 * OFF:
 *   Both LEDs are off.
 *
 * HEAT:
 *   Red LED pulses when the current temperature is below
 *   the set temperature.
 *   Red LED is solid when the current temperature is equal
 *   to or above the set temperature.
 *
 * COOL:
 *   Blue LED pulses when the current temperature is above
 *   the set temperature.
 *   Blue LED is solid when the current temperature is equal
 *   to or below the set temperature.
 *
 * Buttons:
 *   State button  - cycles OFF -> HEAT -> COOL -> OFF
 *   Increase      - raises setpoint by 1 degree Fahrenheit
 *   Decrease      - lowers setpoint by 1 degree Fahrenheit
 *
 * LCD:
 *   Line 1 displays date/time.
 *   Line 2 alternates between current temperature and
 *   thermostat state/setpoint.
 *
 * Serial:
 *   Sends thermostat state, temperature, and setpoint via usb interface.
 *
 * Wi-Fi:
 *   Connects to the internet to discover the user's locale as well as the date and time.
 *
 * Hardware:
 *   Arduino UNO R4 WiFi
 *   DHT11 temperature/humidity sensor
 *   16x2 parallel LCD
 *   Red LED
 *   Blue LED
 *   Three push buttons
 */

//Display and Sensor
#include <LiquidCrystal.h>
#include "RTC.h"
#include "DHT.h"

//R4 Built in Display
#include "ArduinoGraphics.h"
#include "Arduino_LED_Matrix.h"


// Wifi Includes
#include <WiFiS3.h>
#include <WiFiSSLClient.h>
#include <WiFiUdp.h>
#include <NTPClient.h>

// Wifi Login info
#include "arduino_secrets.h"

// ============================================================
// PIN DEFINITIONS
// ============================================================

// LEDs
const int RED_LED_PIN = 5;       // PWM
const int BLUE_LED_PIN = 6;      // PWM

// Buttons
const int STATE_BUTTON_PIN = 2;  // Green
const int INCREASE_BUTTON_PIN = 3; //  Red
const int DECREASE_BUTTON_PIN = 4; // Blue

// LCD
const int LCD_RS = 7;
const int LCD_EN = 8;
const int LCD_D4 = 9;
const int LCD_D5 = 10;
const int LCD_D6 = 11;
const int LCD_D7 = 12;


// ============================================================
// OBJECTS
// ============================================================

// DHT11 temperature/humidity sensor
#define DHT_PIN 13
#define DHT_TYPE DHT11

DHT dht(DHT_PIN, DHT_TYPE);

// 16x2 parallel LCD
LiquidCrystal lcd(
  LCD_RS,
  LCD_EN,
  LCD_D4,
  LCD_D5,
  LCD_D6,
  LCD_D7
);

//LED Matrix
ArduinoLEDMatrix matrix;

// ============================================================
// WIFI
// ============================================================

WiFiSSLClient httpClient;
WiFiUDP ntpUDP;

NTPClient timeClient(
  ntpUDP,
  "pool.ntp.org",
  0,
  60000
);

// ============================================================
// THERMOSTAT STATE
// ============================================================

enum ThermostatState {
  OFF,
  HEAT,
  COOL
};

ThermostatState currentState = OFF;


// ============================================================
// THERMOSTAT SETTINGS
// ============================================================

// Default setting is 72 degrees Fahrenheit.
int setPoint = 72;


// ============================================================
// TIMING
// ============================================================

// Replaces the sleep calls and threading from the original python script

// LCD update interval
unsigned long lastDisplayUpdate = 0;
const unsigned long DISPLAY_INTERVAL = 1000;

// Temperature update interval
unsigned long lastTemperatureUpdate = 0;
const unsigned long TEMPERATURE_INTERVAL = 2000; // 2 Seconds

// Serial status interval
unsigned long lastSerialUpdate = 0;
const unsigned long SERIAL_INTERVAL = 30000;

// Wi-Fi/NTP time synchronization interval
unsigned long lastTimeSync = 0;
const unsigned long TIME_SYNC_INTERVAL = 86400000UL;  // 24 hours

// Maximum amount of time to spend trying to connect to Wi-Fi
const unsigned long WIFI_CONNECT_TIMEOUT = 30000;

// LED pulse timing
unsigned long lastPulseUpdate = 0;
const unsigned long PULSE_INTERVAL = 10;

int pulseBrightness = 0;
int pulseDirection = 3;


// ============================================================
// DISPLAY ALTERNATION
// ============================================================

bool displayTemperature = true;
bool displaySetTemperature = false;
unsigned long lastDisplayModeChange = 0;

unsigned long setTemperatureDisplayStart = 0;

// How long to show Current or set temp before switching display mode
const unsigned long CURRENT_TEMP_DISPLAY_TIME = 10000; // 10 seconds
const unsigned long SET_TEMP_DISPLAY_TIME = 5000;  // 5 Seconds 

// How long to force the set temperature after +/-
const unsigned long SET_TEMP_OVERRIDE_TIME = 5000; // 5 seconds


// ============================================================
// TEMPERATURE STORAGE
// ============================================================

float currentTemperatureC = 0.0;
float currentTemperatureF = 32.0;
float currentHumidity = 0.0;


// ============================================================
// BUTTON STATE
// ============================================================

bool lastStateButton = HIGH;
bool lastIncreaseButton = HIGH;
bool lastDecreaseButton = HIGH;

// Time display mode:
// false = 12-hour time without seconds
// true  = 24-hour (military) time with seconds
bool militaryTime = false;

// Used to detect a 3-second hold of the green/state button.
unsigned long stateButtonPressedAt = 0;
bool stateButtonHoldHandled = false;

const unsigned long STATE_BUTTON_HOLD_TIME = 3000;


// ============================================================
// CUSTOM LCD DEGREE SYMBOL
// ============================================================

byte degreeSymbol[8] = {
  B01110,
  B01010,
  B01110,
  B00000,
  B00000,
  B00000,
  B00000,
  B00000
};


// ============================================================
// DEBUG
// ============================================================

const bool DEBUG = true;


// ============================================================
// SETUP
// ============================================================

void setup() {

  // ----------------------------------------------------------
  // Serial
  // ----------------------------------------------------------

  Serial.begin(115200);

  delay(500);

  if (DEBUG) {
    Serial.println();
    Serial.println("=================================");
    Serial.println("Arduino UNO R4 WiFi Thermostat");
    Serial.println("=================================");
  }


  // ----------------------------------------------------------
  // LED configuration
  // ----------------------------------------------------------

  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(BLUE_LED_PIN, OUTPUT);

  analogWrite(RED_LED_PIN, 0);
  analogWrite(BLUE_LED_PIN, 0);


  // ----------------------------------------------------------
  // Button configuration
  // ----------------------------------------------------------

  // INPUT_PULLUP means:
  //
  // Button not pressed = HIGH
  // Button pressed     = LOW
  //
  // Connect the other side of each button to GND.
  pinMode(STATE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(INCREASE_BUTTON_PIN, INPUT_PULLUP);
  pinMode(DECREASE_BUTTON_PIN, INPUT_PULLUP);


  // ----------------------------------------------------------
  // LCD
  // ----------------------------------------------------------

  lcd.begin(16, 2);

  lcd.createChar(0, degreeSymbol);

  lcd.clear();

  lcd.setCursor(0, 0);
  lcd.print("Thermostat");
  lcd.setCursor(0, 1);
  lcd.print("Starting...");

  // ----------------------------------------------------------
  // LED Matrix
  // ----------------------------------------------------------

  matrix.begin();


  // ----------------------------------------------------------
  // DHT11 Sensor
  // ----------------------------------------------------------

  if (DEBUG) {
    Serial.println("Initializing DHT11...");
  }

  dht.begin();

  if (DEBUG) {
    Serial.println("DHT11 initialized.");
  }


  // ----------------------------------------------------------
  // RTC / Wi-Fi / NTP
  // ----------------------------------------------------------

  RTC.begin();

  // Synchronizes the built-in RTC from an NTP server.
  // So that time and date should still display correctly if connection is lost.
  if (synchronizeTime()) {
    lastTimeSync = millis();
  }


  // ----------------------------------------------------------
  // Initial temperature reading
  // ----------------------------------------------------------

  updateTemperature();


  // ----------------------------------------------------------
  // Initial thermostat state
  // ----------------------------------------------------------

  updateLights();


  // ----------------------------------------------------------
  // Initial display
  // ----------------------------------------------------------

  updateDisplay();

  lastDisplayModeChange = millis();
  lastTemperatureUpdate = millis();
  lastDisplayUpdate = millis();
  lastSerialUpdate = millis();

  if (DEBUG) {
    Serial.println("Thermostat ready.");
    Serial.print("Set Point: ");
    Serial.print(setPoint);
    Serial.println(" F");
    Serial.println();
  }
}


// ============================================================
// MAIN LOOP
// ============================================================

void loop() {

  unsigned long currentMillis = millis();


  // ----------------------------------------------------------
  // Process buttons
  // ----------------------------------------------------------

  processButtons();

  // ----------------------------------------------------------
  // Show set temperature for 5 seconds after adjustment
  // ----------------------------------------------------------

  if (displaySetTemperature &&
      currentMillis - setTemperatureDisplayStart >= SET_TEMP_OVERRIDE_TIME) {

    displaySetTemperature = false;

    // Restart the normal display rotation.
    lastDisplayModeChange = currentMillis;

    displayTemperature = true;

    updateDisplay();
  }


  // ----------------------------------------------------------
  // Update temperature
  // ----------------------------------------------------------

  if (currentMillis - lastTemperatureUpdate >= TEMPERATURE_INTERVAL) {

    lastTemperatureUpdate = currentMillis;

    updateTemperature();
    updateLights();
  }


  // ----------------------------------------------------------
  // Update LED pulse
  // ----------------------------------------------------------

  if (currentMillis - lastPulseUpdate >= PULSE_INTERVAL) {

    lastPulseUpdate = currentMillis;

    updatePulse();
  }


  // ----------------------------------------------------------
  // Alternate LCD display
  // ----------------------------------------------------------

  if (!displaySetTemperature) {

  unsigned long displayInterval;

  if (displayTemperature) {
    displayInterval = CURRENT_TEMP_DISPLAY_TIME;
  }
  else {
    displayInterval = SET_TEMP_DISPLAY_TIME;
  }

  if (currentMillis - lastDisplayModeChange >= displayInterval) {

    lastDisplayModeChange = currentMillis;

    displayTemperature = !displayTemperature;

    updateDisplay();
  }
}


  // ----------------------------------------------------------
  // Update LCD
  // ----------------------------------------------------------

  if (currentMillis - lastDisplayUpdate >= DISPLAY_INTERVAL) {

    lastDisplayUpdate = currentMillis;

    updateDisplay();
  }


  // ----------------------------------------------------------
  // Re-synchronize RTC from NTP every 24 hours
  // ----------------------------------------------------------

  if (currentMillis - lastTimeSync >= TIME_SYNC_INTERVAL) {

    if (synchronizeTime()) {
      lastTimeSync = currentMillis;
    }
  }


  // ----------------------------------------------------------
  // Send serial status every 30 seconds
  // ----------------------------------------------------------

  if (currentMillis - lastSerialUpdate >= SERIAL_INTERVAL) {

    lastSerialUpdate = currentMillis;

    sendSerialStatus();
  }
}


  // ============================================================
  // BUTTON PROCESSING
  // ============================================================

void processButtons() {

  bool stateButton = digitalRead(STATE_BUTTON_PIN);
  bool increaseButton = digitalRead(INCREASE_BUTTON_PIN);
  bool decreaseButton = digitalRead(DECREASE_BUTTON_PIN);


  // ----------------------------------------------------------
  // State button (Green Button)
  // ----------------------------------------------------------

  if (stateButton == LOW && lastStateButton == HIGH) {

    // Button was just pressed.

    stateButtonPressedAt = millis();
    stateButtonHoldHandled = false;
  }


  if (stateButton == LOW && !stateButtonHoldHandled) {

    if (millis() - stateButtonPressedAt >= STATE_BUTTON_HOLD_TIME) {

      militaryTime = !militaryTime;

      stateButtonHoldHandled = true;

      updateDisplay();

      if (DEBUG) {

        Serial.print("Time display changed to: ");

        if (militaryTime) {
          Serial.println("24-hour with seconds");
        }
        else {
          Serial.println("12-hour without seconds");
        }
      }
    }
  }


  if (stateButton == HIGH && lastStateButton == LOW) {

    // Button was released.

    // Only treat it as a state-cycle press if the 3-second
    // hold has not already been handled.

    if (!stateButtonHoldHandled) {

      cycleThermostatState();
    }

    stateButtonPressedAt = 0;
  }


  // ----------------------------------------------------------
  // Increase setpoint (Red Button)
  // ----------------------------------------------------------

  if (lastIncreaseButton == HIGH && increaseButton == LOW) {

    setPoint++;

    //Used to show setTemp while user is modifying it.
    displaySetTemperature = true;
    setTemperatureDisplayStart = millis();

    if (DEBUG) {
      Serial.print("Increasing Set Point: ");
      Serial.println(setPoint);
    }

    updateLights();
    updateDisplay();

    delay(50);
  }


  // ----------------------------------------------------------
  // Decrease setpoint (Blue Button)
  // ----------------------------------------------------------

  if (lastDecreaseButton == HIGH && decreaseButton == LOW) {

    setPoint--;

    //Used to show setTemp while user is modifying it.
    displaySetTemperature = true;
    setTemperatureDisplayStart = millis();

    if (DEBUG) {
      Serial.print("Decreasing Set Point: ");
      Serial.println(setPoint);
    }

    updateLights();
    updateDisplay();

    delay(50);
  }


  // Save current button states.
  lastStateButton = stateButton;
  lastIncreaseButton = increaseButton;
  lastDecreaseButton = decreaseButton;
}


// ============================================================
// STATE MACHINE
// ============================================================

void cycleThermostatState() {

  switch (currentState) {

    case OFF:
      currentState = HEAT;

      if (DEBUG) {
        Serial.println("* Changing state to heat");
      }

      break;


    case HEAT:
      currentState = COOL;

      if (DEBUG) {
        Serial.println("* Changing state to cool");
      }

      break;


    case COOL:
      currentState = OFF;

      if (DEBUG) {
        Serial.println("* Changing state to off");
      }

      break;
  }


  updateLights();
  updateDisplay();
}


// ============================================================
// TEMPERATURE FUNCTIONS
// ============================================================

void updateTemperature() {

  float temperatureC = dht.readTemperature();
  float humidity = dht.readHumidity();

  // Check whether the DHT11 returned valid data.
  if (isnan(temperatureC) || isnan(humidity)) {

    if (DEBUG) {
      Serial.println("ERROR: Failed to read from DHT11");
    }

    return;
  }

  // Store the readings.
  currentTemperatureC = temperatureC;

  currentTemperatureF =
    (currentTemperatureC * (9.0 / 5.0)) + 32.0;

  currentHumidity = humidity;


  if (DEBUG) {

    Serial.print("Temperature: ");
    Serial.print(currentTemperatureF, 1);
    Serial.println(" F");

    Serial.print("Humidity: ");
    Serial.print(currentHumidity, 1);
    Serial.println(" %");
  }
}


// ============================================================
// LED CONTROL
// ============================================================

void updateLights() {


  int temperature =
    (int)floor(currentTemperatureF);


  if (DEBUG) {

    Serial.print("State: ");
    Serial.println(getStateName());

    Serial.print("SetPoint: ");
    Serial.println(setPoint);

    Serial.print("Temp: ");
    Serial.println(temperature);
  }


  // ----------------------------------------------------------
  // OFF
  // ----------------------------------------------------------

  if (currentState == OFF) {

    analogWrite(RED_LED_PIN, 0);
    analogWrite(BLUE_LED_PIN, 0);

  }


  // ----------------------------------------------------------
  // HEAT
  // ----------------------------------------------------------

  else if (currentState == HEAT) {

    // Temperature below setpoint:
    // pulse red LED.
    if (temperature < setPoint) {

      // pulseBrightness will be handled by updatePulse()
      analogWrite(BLUE_LED_PIN, 0);

    }

    // Temperature equal to or above setpoint:
    // solid red LED.
    else {

      analogWrite(RED_LED_PIN, 255);
      analogWrite(BLUE_LED_PIN, 0);
    }
  }


  // ----------------------------------------------------------
  // COOL
  // ----------------------------------------------------------

  else if (currentState == COOL) {

    // Temperature above setpoint:
    // pulse blue LED.
    if (temperature > setPoint) {

      // pulseBrightness handled by updatePulse()
      analogWrite(RED_LED_PIN, 0);

    }

    // Temperature equal to or below setpoint:
    // solid blue LED.
    else {

      analogWrite(RED_LED_PIN, 0);
      analogWrite(BLUE_LED_PIN, 255);
    }
  }
}


// ============================================================
// LED PULSE
// ============================================================

void updatePulse() {

  // ----------------------------------------------------------
  // HEAT PULSE
  // ----------------------------------------------------------

  if (currentState == HEAT &&
      ((int)floor(currentTemperatureF) < setPoint)) {

    pulseBrightness += pulseDirection;

    if (pulseBrightness >= 255) {

      pulseBrightness = 255;
      pulseDirection = -pulseDirection;

    }

    if (pulseBrightness <= 0) {

      pulseBrightness = 0;
      pulseDirection = -pulseDirection;

    }

    analogWrite(RED_LED_PIN, pulseBrightness);
    analogWrite(BLUE_LED_PIN, 0);

  }


  // ----------------------------------------------------------
  // COOL PULSE
  // ----------------------------------------------------------

  else if (currentState == COOL &&
           ((int)floor(currentTemperatureF) > setPoint)) {

    pulseBrightness += pulseDirection;

    if (pulseBrightness >= 255) {

      pulseBrightness = 255;
      pulseDirection = -pulseDirection;

    }

    if (pulseBrightness <= 0) {

      pulseBrightness = 0;
      pulseDirection = -pulseDirection;

    }

    analogWrite(RED_LED_PIN, 0);
    analogWrite(BLUE_LED_PIN, pulseBrightness);

  }
}



// ============================================================
// LCD DISPLAY
// ============================================================

void updateDisplay() {

  lcd.clear();
  
  //LED Display updates every time LCD does
  updateTemperatureMatrix();


// ----------------------------------------------------------
// DISPLAY LINE 1 - Date and Time
// ----------------------------------------------------------
// Displays current time in military time or 12 hour format

RTCTime currentTime;

if (RTC.getTime(currentTime)) {

  char line1[17];

  int hour = currentTime.getHour();
  int day = currentTime.getDayOfMonth();

  if (militaryTime) {

    // 24-hour format with seconds.
    //
    // Example:
    // Aug 23 19:28:42

    snprintf(
      line1,
      sizeof(line1),
      "%s %d%s  %d:%02d",
      getMonthName(currentTime.getMonth()),
      day,
      getDaySuffix(day),
      hour,
      currentTime.getMinutes()
    );

  }
  else {

    // 12-hour format without seconds.
    //
    // Example:
    // Aug 23 7:28 PM

    bool isPM = (hour >= 12);

    int displayHour = hour % 12;

    if (displayHour == 0) {
      displayHour = 12;
    }

    snprintf(
      line1,
      sizeof(line1),
      "%s %d%s %2d:%02d%s",
      getMonthName(currentTime.getMonth()),
      day,
      getDaySuffix(day),
      displayHour,
      currentTime.getMinutes(),
      isPM ? "PM" : "AM"
    );
  }

  lcd.setCursor(0, 0);
  lcd.print(line1);

}
else {

  lcd.setCursor(0, 0);
  lcd.print("Time unavailable");
}


  // ----------------------------------------------------------
  // DISPLAY LINE 2 - Current and Set Temperature
  // ----------------------------------------------------------

  lcd.setCursor(0, 1);


  if (displayTemperature && !displaySetTemperature) {

    lcd.print("Curr Temp: ");

    lcd.print(currentTemperatureF, 0);

    lcd.write(byte(0));

    lcd.print("F");

  }


  else {

    switch (currentState) {

      case OFF:

        lcd.print(" Set Temp: ");

        break;


      case HEAT:

        lcd.print("Heating to ");

        break;


      case COOL:

        lcd.print("Cooling to ");

        break;
    }

    lcd.print(setPoint);

    lcd.write(byte(0));

    lcd.print("F");
  }
}


// ============================================================
// LED DISPLAY
// ============================================================
// Controls the Arduino's built in LED Display

void updateTemperatureMatrix() {

  matrix.beginDraw();

  matrix.stroke(0xFFFFFFFF);
  matrix.textFont(Font_4x6);

  if (displaySetTemperature == true){
    matrix.beginText(0, 1, 0xFFFFFF);
    matrix.print((int)round(setPoint));
    matrix.print("F");
  }
  else{
    matrix.beginText(0, 1, 0xFFFFFF);
    matrix.print((int)round(currentTemperatureF));
    matrix.print("F");
  }

  matrix.endText(NO_SCROLL);

  matrix.endDraw();
}


// ============================================================
// MONTH NAME
// ============================================================

const char* getMonthName(Month month) {

  switch (month) {

    case Month::JANUARY:
      return "Jan";

    case Month::FEBRUARY:
      return "Feb";

    case Month::MARCH:
      return "Mar";

    case Month::APRIL:
      return "Apr";

    case Month::MAY:
      return "May";

    case Month::JUNE:
      return "Jun";

    case Month::JULY:
      return "Jul";

    case Month::AUGUST:
      return "Aug";

    case Month::SEPTEMBER:
      return "Sep";

    case Month::OCTOBER:
      return "Oct";

    case Month::NOVEMBER:
      return "Nov";

    case Month::DECEMBER:
      return "Dec";
  }

  return "???";
}

// ============================================================
// GET DAY SUFFIX
// ============================================================

const char* getDaySuffix(int day) {

  // 11th, 12th, and 13th are exceptions.
  if (day >= 11 && day <= 13) {
    return "th";
  }

  switch (day % 10) {

    case 1:
      return "st";

    case 2:
      return "nd";

    case 3:
      return "rd";

    default:
      return "th";
  }
}

// ============================================================
// SERIAL STATUS
// ============================================================

void sendSerialStatus() {

  Serial.print(getStateName());

  Serial.print(", ");

  Serial.print(currentTemperatureF, 1);

  Serial.print(", ");

  Serial.println(setPoint);
}


// ============================================================
// STATE NAME
// ============================================================

const char* getStateName() {

  switch (currentState) {

    case OFF:
      return "off";

    case HEAT:
      return "heat";

    case COOL:
      return "cool";
  }

  return "off";
}

// ============================================================
// WIFI / NTP / TIMEZONE SYNCHRONIZATION
// ============================================================
//
// NTP provides UTC time.
// ipapi.co provides the timezone/UTC offset associated with the public Internet IP address. 
// Provided utc_offset value includes daylight-saving adjustment.
//
// The lookup is repeated every 24 hours.
// If either Internet request fails, the existing RTC time is left alone.
// ============================================================

// Parse an HTTP response body field containing an offset such as "-0500", or "+0500".
bool parseUtcOffset(const String& value, long &offsetSeconds) {

  String offset = value;
  offset.trim();

  if (offset.length() < 5) {
    return false;
  }

  char sign = offset.charAt(0);

  if (sign != '+' && sign != '-') {
    return false;
  }

  int hours = offset.substring(1, 3).toInt();
  int minutes = offset.substring(3, 5).toInt();

  if (hours > 23 || minutes > 59) {
    return false;
  }

  offsetSeconds = ((long)hours * 3600L) + ((long)minutes * 60L);

  if (sign == '-') {
    offsetSeconds = -offsetSeconds;
  }

  return true;
}


// Read the UTC offset from ipapi.co.
bool getNetworkUtcOffset(long &offsetSeconds) {

  const char* host = "ipapi.co";
  const int port = 443;

  Serial.println("Detecting timezone from Internet location...");

  if (!httpClient.connect(host, port)) {

    Serial.println("ERROR: Could not connect securely to ipapi.co.");

    return false;
  }


  // Request the current UTC offset over HTTPS.
  httpClient.println("GET /utc_offset/ HTTP/1.1");
  httpClient.println("Host: ipapi.co");
  httpClient.println("Connection: close");
  httpClient.println();


  // Wait for the HTTP response.
  unsigned long start = millis();

  while (!httpClient.available() &&
         millis() - start < 10000) {

    delay(10);
  }

  if (!httpClient.available()) {

    Serial.println("ERROR: No response from ipapi.co.");

    httpClient.stop();

    return false;
  }


  // Skip HTTP headers.
  bool headersEnded = false;

  while (httpClient.connected() || httpClient.available()) {

    String line = httpClient.readStringUntil('\n');

    line.trim();

    if (line.length() == 0) {

      headersEnded = true;

      break;
    }
  }

  if (!headersEnded) {

    Serial.println("ERROR: Invalid HTTP response.");

    httpClient.stop();

    return false;
  }

  // Read the response body.
  String response = "";

  unsigned long responseStart = millis();

  while ((httpClient.connected() || httpClient.available()) &&
         millis() - responseStart < 5000) {

    while (httpClient.available()) {
      response += httpClient.readString();
    }

    delay(10);
  }

  httpClient.stop();

  response.trim();


  Serial.print("Detected UTC offset: ");
  Serial.println(response);


  if (!parseUtcOffset(response, offsetSeconds)) {

    Serial.println("ERROR: Could not parse UTC offset.");

    return false;
  }


  return true;
}


// Set the RTC using the current NTP time and the
// automatically detected network UTC offset.
bool setRTCFromNTP() {

  Serial.println("Getting time from NTP...");

  if (!timeClient.forceUpdate()) {

    Serial.println("ERROR: NTP time update failed.");

    return false;
  }


  // NTPClient returns Unix epoch time in UTC.
  unsigned long utcEpoch = timeClient.getEpochTime();

  long offsetSeconds = 0;


  // Determine the current timezone offset from the
  // public Internet IP address.
  if (!getNetworkUtcOffset(offsetSeconds)) {

    Serial.println("ERROR: Could not determine timezone.");

    return false;
  }


  // Apply the current local UTC offset.
  unsigned long localEpoch;

  if (offsetSeconds >= 0) {

    localEpoch =
      utcEpoch + (unsigned long)offsetSeconds;

  }
  else {

    localEpoch =
      utcEpoch - (unsigned long)(-offsetSeconds);
  }


  // Display the detected offset.
  Serial.print("UTC offset: ");

  if (offsetSeconds >= 0) {
    Serial.print("+");
  }

  Serial.print(offsetSeconds / 3600);

  Serial.print(" hours");

  if ((abs(offsetSeconds) % 3600) != 0) {

    Serial.print(" ");

    Serial.print((abs(offsetSeconds) % 3600) / 60);

    Serial.print(" minutes");
  }

  Serial.println();


  // Set the UNO R4 RTC.
  RTCTime rtcTime(localEpoch);

  RTC.setTime(rtcTime);


  // Verify the RTC.
  RTCTime currentTime;

  if (!RTC.getTime(currentTime)) {

    Serial.println("ERROR: Could not read RTC after synchronization.");

    return false;
  }


  Serial.print("RTC synchronized to: ");
  Serial.println(currentTime);

  return true;
}


// Connect to Wi-Fi and synchronize the RTC.
bool synchronizeTime() {

  Serial.println();
  Serial.println("=================================");
  Serial.println("Wi-Fi / NTP / Timezone Sync");
  Serial.println("=================================");


  // Check the Wi-Fi module.
  if (WiFi.status() == WL_NO_MODULE) {

    Serial.println("ERROR: Wi-Fi module not detected.");

    return false;
  }


  // Connect if necessary.
  if (WiFi.status() != WL_CONNECTED) {

    Serial.print("Connecting to Wi-Fi: ");
    Serial.println(SECRET_SSID);

    WiFi.begin(SECRET_SSID, SECRET_PASS);

    unsigned long connectionStart = millis();

    while (WiFi.status() != WL_CONNECTED &&
           millis() - connectionStart < WIFI_CONNECT_TIMEOUT) {

      delay(500);
      Serial.print(".");
    }

    Serial.println();

    if (WiFi.status() != WL_CONNECTED) {

      Serial.println("ERROR: Wi-Fi connection timed out.");

      return false;
    }
  }


  Serial.println("Wi-Fi connected.");

  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());


  // Start the NTP client.
  timeClient.begin();


  if (!setRTCFromNTP()) {

    Serial.println("Time synchronization failed.");

    return false;
  }


  Serial.println("Time synchronization complete.");

  return true;
}

