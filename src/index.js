import * as React from "react";
import { Text, View, StyleSheet, Button, FlatList, SafeAreaView, TouchableOpacity, TextInput } from "react-native";
import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

const getData = async () => {
    try {
        const value = await AsyncStorage.getItem("listofrecordings");
        return !value ? [] : JSON.parse(value);
    } catch (e) {
        // error reading value
        console.log(e);
    }
};

const setData = async (newArray) => {
    // save this to asyncstorage
    try {
        const jsonValue = JSON.stringify(newArray);
        await AsyncStorage.setItem("listofrecordings", jsonValue);
    } catch (e) {
        // saving error
        console.error("error storing list of recordings");
    }
}

const Item = ({ title }) => {
    console.log(title);

    return (
        <View style={styles.item}>
            <Text style={styles.title}>{title}</Text>
        </View>
    );
};

export default function App() {
    const [recording, setRecording] = React.useState();
    const [sound, setSound] = React.useState();
    //const [audiofile, setAudiofile] = React.useState();
    const [recordinglist, setRecordinglist] = React.useState([]);

    // read the data first
    React.useEffect(() => {
        // define logic for reading recordings
        getData().then((dataReturned) => {
            console.log(dataReturned);
            setRecordinglist(dataReturned); //stores list of recordings in the recordingList variable
        });
    }, []); // this only gets called once, not whenever it's changed.

    async function startRecording() {
        try {
            console.log("Requesting permissions..");
            await Audio.requestPermissionsAsync();
            await Audio.setAudioModeAsync({
                allowsRecordingIOS: true,
                playsInSilentModeIOS: true,
            });
            console.log("Starting recording..");
            const recording = new Audio.Recording();
            await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
            await recording.startAsync();
            setRecording(recording);
            console.log("Recording started");
        } catch (err) {
            console.error("Failed to start recording", err);
        }
    }

    async function stopRecording() {
        console.log("Stopping recording..");
        setRecording(undefined);
        await recording.stopAndUnloadAsync();
        const uri = recording.getURI();
        // set the audio recording, pass in URI so this could be called later as an object in playSound()
        // setAudiofile(uri);
        // update the reocrdingList through hook and replace the existing object in AsyncStorage
        const newArray = [...recordinglist];
        newArray.push({'filepath': uri, 'filename': extractFilename(uri)});
        setRecordinglist(newArray);
        setData(newArray);
        console.log("Recording stopped and stored at", uri);
    }

    async function playSound(filepath) {
        console.log("Loading Sound");
        const { sound } = await Audio.Sound.createAsync({ uri: filepath });
        setSound(sound);

        console.log("Playing Sound");
        await sound.playAsync();
    }

    // function to delete a recording:
    async function deleteRecording(filepath) {
        console.log('deleting recording');
        const newArray = recordinglist.filter((item) => item.filepath !== filepath);
        setRecordinglist(newArray);
        setData(newArray);
    }

    function extractFilename(filepath) {
        let arraypath = filepath.split('/');
        let filename = arraypath[arraypath.length - 1];
        return filename;
    }

    // function to rename a filename:
    async function renameRecording(oldFilepath, newFilename) {
        console.log('renaming recording');
        const newArray = [...recordinglist];
        for (const i of newArray) {
            if (i.filepath == oldFilepath) {
                i.filename = newFilename;
            }
        }
        setRecordinglist(newArray);
        setData(newArray);
    }

    React.useEffect(() => {
        return sound
            ? () => {
                  console.log("Unloading Sound");
                  sound.unloadAsync();
              }
            : undefined;
    }, [sound]);

    const renderItem = ({ item }) => {
        console.log(item); // item is a {filepath: "", filename: ""} because recordingList is an array of objects
        return (
            <>
                {/*<TouchableOpacity style={styles.button} onPress={() => {playSound(item.filepath)}}>
                    <Item title={item.filename}/>
                </TouchableOpacity>*/}
                <TextInput
                    style={{ height: 40, borderColor: 'gray', borderWidth: 1 }}
                    onChangeText={text => renameRecording(item.filepath, text)}
                    value={item.filename}
                />
                <Button title='Play' onPress={() => playSound(item.filepath)} />
                <Button title='Delete' onPress={() => deleteRecording(item.filepath)} />
            </>
        );
    };

    // const ourKeyExtractor = (parameter) => {
    //     return parameter.filepath
    // }

    return (
        <SafeAreaView style={styles.container}>
            <Button
                title={recording ? "Stop Recording" : "Start Recording"}
                onPress={recording ? stopRecording : startRecording}
            />
            {/* <Button title="Play Sound" onPress={playSound} /> */}
            {/* if recordingList is ["file1", "file2"]  then keyExtractior expects (string) => string*/}
            {/* if recordingList is [{"filepath": "~/Downloads/file1.mp4", filename: "file1.mp4"}]  then keyExtractior expects ({"filepath":  "", "filename": string}) => string*/}
            <FlatList data={recordinglist} renderItem={renderItem} keyExtractor={(item) => item.filepath} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        justifyContent: "center",
        backgroundColor: "green",
        padding: 10,
    },
    button: {
        alignItems: "center",
        backgroundColor: "blue",
        padding: 10,
    },
    title: {
        backgroundColor: "red",
    },
});
