<a href="https://107-systems.org/"><img align="right" src="https://raw.githubusercontent.com/107-systems/.github/main/logo/107-systems.png" width="15%"></a>
`107-Arduino-Sensor`
====================
[![Arduino Library Badge](https://www.ardu-badge.com/badge/107-Arduino-Sensor.svg?)](https://www.ardu-badge.com/107-Arduino-Sensor)
[![Compile Examples](https://github.com/107-systems/107-Arduino-Sensor/workflows/Compile%20Examples/badge.svg)](https://github.com/107-systems/107-Arduino-Sensor/actions?workflow=Compile+Examples)
[![Arduino Lint](https://github.com/107-systems/107-Arduino-Sensor/workflows/Arduino%20Lint/badge.svg)](https://github.com/107-systems/107-Arduino-Sensor/actions?workflow=Arduino+Lint)
[![keywords.txt Checks](https://github.com/107-systems/107-Arduino-Sensor/workflows/Extra%20Library%20Checks/badge.svg)](https://github.com/107-systems/107-Arduino-Sensor/actions?workflow=Extra+Library+Checks)
[![General Formatting Checks](https://github.com/107-systems/107-Arduino-Sensor/workflows/General%20Formatting%20Checks/badge.svg)](https://github.com/107-systems/107-Arduino-Sensor/actions?workflow=General+Formatting+Checks)
[![Spell Check](https://github.com/107-systems/107-Arduino-Sensor/workflows/Spell%20Check/badge.svg)](https://github.com/107-systems/107-Arduino-Sensor/actions?workflow=Spell+Check)

<p align="center">
  <a href="https://github.com/107-systems/viper"><img src="https://github.com/107-systems/.github/raw/main/logo/viper.jpg" width="40%"></a>
</p>

A unified sensor abstraction layer used by all 107-system sensor libraries.

This library works for
* [ArduinoCore-samd](https://github.com/arduino/ArduinoCore-samd): [`Arduino Zero`](https://store.arduino.cc/arduino-zero), [`MKR 1000`](https://store.arduino.cc/arduino-mkr1000-wifi), [`MKR WiFi 1010`](https://store.arduino.cc/arduino-mkr-wifi-1010), [`Nano 33 IoT`](https://store.arduino.cc/arduino-nano-33-iot), [`MKR GSM 1400`](https://store.arduino.cc/arduino-mkr-gsm-1400-1415), [`MKR NB 1500`](https://store.arduino.cc/arduino-mkr-nb-1500-1413), [`MKR WAN 1300/1310`](https://store.arduino.cc/mkr-wan-1310) :heavy_check_mark:
* [ArduinoCore-mbed](https://github.com/arduino/ArduinoCore-mbed): [`Portenta H7`](https://store.arduino.cc/portenta-h7), [`Nano 33 BLE`](https://store.arduino.cc/arduino-nano-33-ble), [`Nano RP2040 Connect`](https://store.arduino.cc/nano-rp2040-connect), [`Edge Control`](https://store.arduino.cc/edge-control) :heavy_check_mark:
* [arduino-pico](https://github.com/earlephilhower/arduino-pico): [`Raspberry Pi Pico`](https://www.raspberrypi.org/products/raspberry-pi-pico), `Adafruit Feather RP2040`, ... :heavy_check_mark:
* [ArduinoCore-renesas](https://github.com/arduino/ArduinoCore-renesas): [`Portenta C33`](https://store.arduino.cc/products/portenta-c33), [`Uno R4 WiFi`](https://store.arduino.cc/products/uno-r4-wifi), [`Uno R4 Minima`](https://store.arduino.cc/products/uno-r4-minima), ... :heavy_check_mark:

## Example
```C++
#include <107-Arduino-Sensor.hpp>
/* ... */
class DummyPressureSensor : public drone::PressureSensorBase
{
public:

  DummyPressureSensor()
  : drone::PressureSensorBase("BMP388",
                              0.0    * drone::unit::pascal,
                              1000.0 * drone::unit::pascal,
                              25.0   * drone::unit::hertz,
                              [](drone::unit::Pressure const pressure)
                              {
                                Serial.print("[ASYNC] p = ");
                                Serial.print(pressure.value());
                                Serial.println(" Pascal");
                              })
  { }
  virtual ~DummyPressureSensor() { }

  virtual void get(drone::unit::Pressure & val) override { val = drone::unit::Pressure(1023.0 * drone::unit::pascal); }
  void onExternalEvent() { onSensorValueUpdate(drone::unit::Pressure(65.8 * drone::unit::pascal)); }
};
/* ... */
DummyPressureSensor pressure_sensor;
/* ... */
void setup()
{
  Serial.begin(9600);
  while (!Serial) { }

  Serial.println(pressure_sensor);

  drone::unit::Pressure pressure_val = 0.0 * drone::unit::pascal;
  Serial.print("[SYNC] p = ");
  Serial.print(pressure_val.value());
  Serial.println(" Pascal");
  Serial.println();


  pressure_sensor.onExternalEvent();
}

void loop()
{

}
```
