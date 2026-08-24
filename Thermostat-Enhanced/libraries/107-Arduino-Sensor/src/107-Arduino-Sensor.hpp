/**
 * This software is distributed under the terms of the MIT License.
 * Copyright (c) 2021 LXRobotics.
 * Author: Alexander Entinger <alexander.entinger@lxrobotics.com>
 * Contributors: https://github.com/107-systems/107-Arduino-Sensor/graphs/contributors.
 */

#ifndef _107_ARDUINO_SENSOR_HPP_
#define _107_ARDUINO_SENSOR_HPP_

/**************************************************************************************
 * INCLUDE
 **************************************************************************************/

#include <string>
#include <functional>

#include <107-Arduino-BoostUnits.h>

#include <Arduino.h>

/**************************************************************************************
 * DEFINE
 **************************************************************************************/

#define _107_ARDUINO_SENSOR_BASE_MAJOR 0001
#define _107_ARDUINO_SENSOR_BASE_MINOR 0000
#define _107_ARDUINO_SENSOR_BASE_PATCH 0004

#define _107_ARDUINO_SENSOR_BASE_CONCAT_VERSION_(a,b,c) a ## b ## c
#define _107_ARDUINO_SENSOR_BASE_CONCAT_VERSION(a,b,c) _107_ARDUINO_SENSOR_BASE_CONCAT_VERSION_(a,b,c)

#define _107_ARDUINO_SENSOR_BASE_VERSION \
        _107_ARDUINO_SENSOR_BASE_CONCAT_VERSION(_107_ARDUINO_SENSOR_BASE_MAJOR, \
                                                _107_ARDUINO_SENSOR_BASE_MINOR, \
                                                _107_ARDUINO_SENSOR_BASE_PATCH)

/**************************************************************************************
 * NAMESPACE
 **************************************************************************************/

namespace drone
{

/**************************************************************************************
 * CLASS DECLARATION
 **************************************************************************************/

template<typename T>
class ArduinoSensorBase : public virtual Printable
{

public:

  static size_t constexpr MAJOR = _107_ARDUINO_SENSOR_BASE_MAJOR;
  static size_t constexpr MINOR = _107_ARDUINO_SENSOR_BASE_MINOR;
  static size_t constexpr PATCH = _107_ARDUINO_SENSOR_BASE_PATCH;


  typedef std::function<void(T const)> OnSensorValueUpdateFunc;

  ArduinoSensorBase(std::string const & name,
                    T const & max_value,
                    T const & min_value,
                    unit::Frequency const update_rate,
                    OnSensorValueUpdateFunc on_sensor_value_update)
  : _name{name}
  , _max_value{max_value}
  , _min_value{min_value}
  , _update_rate{update_rate}
  , _on_sensor_value_update{on_sensor_value_update}
  { }
  virtual ~ArduinoSensorBase() { }


  inline std::string     name      () const { return _name; }
  inline T               maxValue  () const { return _max_value; }
  inline T               minValue  () const { return _min_value; }
  inline unit::Frequency updateRate() const { return _update_rate; }


  virtual void get(T & val) = 0;


  virtual size_t printTo(Print & p) const override
  {
    size_t n = 0;
    n += p.print("API Version = v");
    n += p.print(MAJOR);
    n += p.print(".");
    n += p.print(MINOR);
    n += p.print(".");
    n += p.println(PATCH);
    n += p.print("Name        = ");
    n += p.println(_name.c_str());
    n += p.print("Max Value   = ");
    n += p.println(_max_value.value());
    n += p.print("Min Value   = ");
    n += p.println(_min_value.value());
    n += p.print("Update Rate = ");
    n += p.println(_update_rate.value());
    return n;
  }

protected:

  inline void setMaxValue  (T const v)                { _max_value = v; }
  inline void setMinValue  (T const v)                { _min_value = v; }
  inline void setUpdateRate(unit::Frequency const ur) { _update_rate = ur; }

  void onSensorValueUpdate(T const v)
  {
    if (_on_sensor_value_update)
      _on_sensor_value_update(v);
  }

private:

  std::string const _name;
  T _max_value, _min_value;
  unit::Frequency _update_rate;
  OnSensorValueUpdateFunc _on_sensor_value_update;

};

/**************************************************************************************
 * TYPEDEF
 **************************************************************************************/

typedef ArduinoSensorBase<unit::Length> LengthSensorBase;
typedef ArduinoSensorBase<unit::Pressure> PressureSensorBase;
typedef ArduinoSensorBase<unit::Temperature> TemperatureSensorBase;

/**************************************************************************************
 * NAMESPACE
 **************************************************************************************/

} /* drone */

#endif /* _107_ARDUINO_SENSOR_HPP_ */
