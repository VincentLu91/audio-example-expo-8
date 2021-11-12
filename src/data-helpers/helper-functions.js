import AsyncStorage from "@react-native-async-storage/async-storage";

export const getData = async () => {
    try {
        const value = await AsyncStorage.getItem("listofrecordings");
        return !value ? [] : JSON.parse(value);
    } catch (e) {
        // error reading value
        console.log(e);
    }
};

export const setData = async (newArray) => {
    // save this to asyncstorage
    try {
        const jsonValue = JSON.stringify(newArray);
        await AsyncStorage.setItem("listofrecordings", jsonValue);
    } catch (e) {
        // saving error
        console.error("error storing list of recordings");
    }
}

export function msToTime(duration) {
  let seconds = Math.floor((duration / 1000) % 60);
  let minutes = Math.floor((duration / (1000 * 60)) % 60);

  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return minutes + ":" + seconds;
}