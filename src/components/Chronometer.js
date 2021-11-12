import React, { useState, useEffect } from 'react';
import { View, Text } from "react-native";

function Chronometer ({currentDuration}) {
  const [time, setTime] = useState({
    seconds: 0,
    minutes: 0,
    hours: 0,
  });

  useEffect(() => {
    if(currentDuration) {
      setTime({
        seconds: Math.floor((currentDuration / 1000) % 60),
        minutes: Math.floor((currentDuration / (1000 * 60)) % 60),
        hours: Math.floor((currentDuration / (1000 * 60 * 60)) % 24)
      })
    }
  }, [currentDuration]);

  useEffect(() => {
    let isCancelled = false;

    const advanceTime = () => {
      setTimeout(() => {
        let nSeconds = time.seconds;
        let nMinutes = time.minutes;
        let nHours = time.hours;

        nSeconds++;

        if (nSeconds > 59) {
          nMinutes++;
          nSeconds = 0;
        }
        if (nMinutes > 59) {
          nHours++;
          nMinutes = 0;
        }
        if (nHours > 24) {
          nHours = 0;
        }

        !isCancelled && setTime({ seconds: nSeconds, minutes: nMinutes, hours: nHours });
      }, 1000);
    };
    advanceTime();

    return () => {
      //final time:
      console.log(time);
      isCancelled = true;
    };
  }, [time]);

  return (
    <View>
      <Text style={{flexDirection: 'row'}}>
        {`
          ${time.hours < 10 ? '0' + time.hours : time.hours}:${time.minutes < 10 ? '0' + time.minutes:time.minutes}:${time.seconds < 10 ? '0' + time.seconds:time.seconds}
        `}
     
      </Text>
    </View>
  );
};

export default Chronometer;
