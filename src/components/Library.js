import * as React from "react";
import {
  TextInput,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Button,
} from "react-native";
import { Audio } from "expo-av";
import { msToTime } from "../data-helpers/helper-functions";
import { useDispatch, useSelector } from "react-redux";
import {
  setCurrentSoundPlaying,
  setCurrentPlayingStatus,
  setDurationMillis,
  setSlidingPosition,
  setSound,
  setSoundPause,
  setSoundStop,
  setRecording,
  setIsRecording,
  setRecordingDuration,
} from "../redux/recording/actions";
import { Feather } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { SwipeListView } from "react-native-swipe-list-view";
import { db, storage } from "../../firebase";
import { navigationRef } from "../../App";
import { printTranscription } from "../redux/language/actions";
import LiveAudioStream from 'react-native-live-audio-stream';

Audio.setAudioModeAsync({
  staysActiveInBackground: true,
  shouldDuckAndroid: true,
  interruptionModeAndroid: Audio.INTERRUPTION_MODE_ANDROID_DO_NOT_MIX,
  playThroughEarpieceAndroid: true,
});

function Library(props) {
  const dispatch = useDispatch();

  const currentPlayingStatus = useSelector(
    (state) => state.recordingReducer.currentPlayingStatus
  );
  const durationMillis = useSelector(
    (state) => state.recordingReducer.durationMillis
  );
  const slidingPosition = useSelector(
    (state) => state.recordingReducer.slidingPosition
  );
  const sound = useSelector((state) => state.recordingReducer.sound);
  const hasSoundPaused = useSelector(
    (state) => state.recordingReducer.hasSoundPaused
  );
  const hasSoundStopped = useSelector(
    (state) => state.recordingReducer.hasSoundStopped
  );
  const recording = useSelector((state) => state.recordingReducer.recording);
  const currentUser = useSelector((state) => state.user.currentUser);

  const [cloudRecordingList, setCloudRecordingList] = React.useState([]);
  const [renameRecordingState, setRenameRecordingState] = React.useState({
    shouldShow: false,
    fileName: "",
  });

  const downloadAudio = async (fileName) => {
    const uri = await storage.child(fileName).getDownloadURL();
    return uri;
  };

  React.useEffect(() => {
    const unsubscribe = db
      .collection("recordings")
      .where("user", "==", currentUser.uid)
      .onSnapshot(
        (querySnapshot) => {
          if (querySnapshot) {
            const data = [];
            const audioDownloads = [];
            querySnapshot.forEach(async (documentSnapshot) => {
              if (documentSnapshot.exists) {
                const originalFilename =
                  documentSnapshot.data().originalFilename;
                data.push(documentSnapshot.data());
                audioDownloads.push(downloadAudio(originalFilename));
              }
            });

            Promise.all(audioDownloads).then((res) => {
              setCloudRecordingList(
                data.map((el, i) => {
                  return { ...el, filepath: res[i] };
                })
              );
            });
          }
        },
        (err) => {
          console.log(err);
        }
      );

    return () => unsubscribe();
  }, [cloudRecordingList.length]);

  async function playSound(filepath, currentSound) {
    console.log("If any recording, stop now");
    dispatch(setRecording(undefined));
    dispatch(setIsRecording(false));
    dispatch(setRecordingDuration(0));
    await recording?.stopAndUnloadAsync();

    console.log("Loading Sound");
    // Reset first
    if (currentSound) {
      console.log("current");
      await currentSound.unloadAsync();
      currentSound.setOnPlaybackStatusUpdate(null);
      // setSound(null);
      dispatch(setSound(null));
      dispatch(setSoundStop(true));
      // sound = null;
    }
    LiveAudioStream.stop();
		if(global.socket) {
      global.socket.onclose = event => {
        console.log(event);
        global.socket = null;
      }
    }

    const { sound } = await Audio.Sound.createAsync(
      { uri: filepath },
      { shouldPlay: false }
    );
    const result = await sound.getStatusAsync();
    const durationMillis = result.durationMillis;
    dispatch(setDurationMillis(durationMillis));
    // setSound(sound); // Just to toggle play overlay
    dispatch(setSound(sound));
    dispatch(setSoundPause(false));
    dispatch(setSoundStop(false));
    dispatch(setSlidingPosition(0));

    console.log("Playing Sound");
    sound.setOnPlaybackStatusUpdate(async (status) => {
      dispatch(
        setCurrentPlayingStatus({
          uri: status.uri,
          isPlaying: status.isPlaying,
        })
      );
      if (status.didJustFinish === true) {
        // audio has finished!
        // Reset
        await sound.unloadAsync();
        dispatch(setSlidingPosition(0));
        dispatch(setSound(null));
        dispatch(setSoundStop(true));
        dispatch(setCurrentPlayingStatus(null));
      }
      if (status.positionMillis && status.isPlaying) {
        // status update, when we stop sliding we pause the audio and it takes time to actually pause and change position
        dispatch(setSlidingPosition(status.positionMillis));
        console.log("Status update: ", status.positionMillis);
      }
    });

    await sound.playAsync();

    dispatch(setCurrentSoundPlaying(sound));
  }

  async function stopSound() {
    await sound.stopAsync();
    dispatch(setSlidingPosition(0));
    dispatch(setSound(null));
    dispatch(setSoundStop(true));
  }

  async function resumeSound() {
    console.log("Resuming Sound", sound);
    await sound.playAsync();
    dispatch(setSoundPause(false));
  }

  async function pauseSound() {
    console.log("Pausing Sound", sound);
    await sound.pauseAsync();
    dispatch(setSoundPause(true));
  }

  // function to rename a filename:
  async function showRenameModal(fileName) {
    if (!currentPlayingStatus?.isPlaying) {
      setRenameRecordingState({ shouldShow: true, fileName });
    } else {
      alert("Please allow the audio to finish or stop the audio before renaming");
      setRenameRecordingState({ shouldShow: false, fileName });
    }

    console.log("renaming recording");
  }

  // function to delete a recording:
  async function deleteRecording(filename) {
    await sound?.stopAsync();
    //await sound?.unloadAsync();
    dispatch(setSlidingPosition(0));
    dispatch(setSound(null));
    dispatch(setSoundStop(true));
    dispatch(setCurrentPlayingStatus(null));
    console.log("deleting recording");
    let query = db
      .collection("recordings")
      .where("user", "==", currentUser.uid)
      .where("originalFilename", "==", filename);
    console.log("Query is: " + query);
    query.get().then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        doc.ref.delete();
        // delete audio file
        storage.child(filename).delete();
      });
    });
  }

  async function viewContent(transcription) {
    dispatch(printTranscription(transcription));
    navigationRef.navigate("Content");
  }

  const renderItem = ({ item, index }) => {
    const originalFilename = item.originalFilename

    const isCurrentPlayingFile =
      currentPlayingStatus?.isPlaying &&
      currentPlayingStatus?.uri.includes(originalFilename);
    return (
      <View
        key={index}
        style={{
          flexDirection: "row",
          height: 70,
          justifyContent: "space-between",
          backgroundColor: "#CCC",
        }}
      >
        <View style={{ justifyContent: "center", margin: 20 }}>
         
              <Text  style={{  color: "green", maxWidth: 200, textAlign: 'left' }}>
            {item.fileName}
          </Text>
          <Text style={{ fontSize: 13, color: "gray" }}>
            {item.recordingdate}
          </Text>
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-around",
            margin: 20,
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 13, color: "gray", marginRight: 10 }}>
            {item.duration}
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() =>
              !isCurrentPlayingFile
                ? playSound(item.filepath, sound)
                : stopSound()
            }
          >
            {!isCurrentPlayingFile ? (
              <Feather name="play" size={24} color="green" />
            ) : (
              <FontAwesome name="stop-circle-o" size={24} color="green" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderHiddenItem = ({ item }, rowMap) => (
    <View style={{flexDirection: "row"}}>
      <View style={styles.rowFront}>
      <TouchableOpacity
        style={styles.leftButton}
        onPress={() => viewContent(item.transcript)}
        activeOpacity={0.9}
      >
        <Text style={styles.actionButtonText}>Transcription</Text>
      </TouchableOpacity>
    </View>
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => deleteRecording(item.originalFilename)}
        activeOpacity={0.9}
      >
        <Text style={styles.actionButtonText}>Delete</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: "green" }]}
        onPress={() => {
          showRenameModal(item.fileName)
            // close row
            rowMap[item.filepath].closeRow()
          }
        }
        activeOpacity={0.9}
      >
        <Text style={styles.actionButtonText}>Rename</Text>
      </TouchableOpacity>
    </View>
    </View>
    
  );

  const RenameModal = ({ renameRecordingState, setRenameRecordingState }) => {
    const { fileName, shouldShow } = renameRecordingState;

    const [newFilename, setNewFileName] = React.useState(fileName);

    const onSubmitRename = () => {
      let query = db
        .collection("recordings")
        .where("user", "==", currentUser.uid)
        .where("fileName", "==", fileName);

      query.get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
          doc.ref.update({ fileName: newFilename });
        });
      });

      // Set
      setRenameRecordingState({ shouldShow: false, fileName: "" });
    };

    return (
      <View style={styles.contain}>
        <Modal visible={shouldShow} animationType="none" transparent={true}>
          <View style={styles.contain}>
            <View style={styles.modalView}>
              <TextInput
                onChangeText={(text) => setNewFileName(text)}
                value={newFilename}
                style={styles.renameInput}
              />

              <Button title="Rename" onPress={onSubmitRename} />
            </View>
          </View>
        </Modal>
      </View>
    );
  };
  return (
    <>
      <SwipeListView
        useFlatList
        data={cloudRecordingList}
        renderItem={renderItem}
        keyExtractor={(item) => item.filepath}
        renderHiddenItem={renderHiddenItem}
        leftOpenValue={75}
        rightOpenValue={-75}
      />
      {console.log("CPS====>", currentPlayingStatus)}
      {renameRecordingState.shouldShow && (
        <RenameModal
          renameRecordingState={renameRecordingState}
          setRenameRecordingState={setRenameRecordingState}
        />
      )}

      {currentPlayingStatus?.uri && !hasSoundStopped && (
        <>
          <View
            style={{
              backgroundColor: "green",
              height: "13%",
              width: "100%",
              flexDirection: "row",
              justifyContent: "flex-start",
              alignItems: "stretch",
            }}
          >
            <View
              style={{
                flexGrow: 1,
                justifyContent: "center",
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <TouchableOpacity
                style={styles.button}
                onPress={() => stopSound()}
              >
                <FontAwesome name="stop-circle-o" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={() => (hasSoundPaused ? resumeSound() : pauseSound())}
              >
                {hasSoundPaused ? (
                  <Feather name="play" size={24} color="white" />
                ) : (
                  <FontAwesome name="pause" size={24} color="white" />
                )}
              </TouchableOpacity>
            </View>
            <View style={{ flexGrow: 4, backgroundColor: "green" }}>
              <Slider
                style={{ width: "80%", height: "100%" }}
                minimumValue={0}
                maximumValue={durationMillis}
                step={1}
                value={slidingPosition}
                minimumTrackTintColor="gray"
                maximumTrackTintColor="gray"
                thumbTintColor="white"
                onSlidingStart={async () => {
                  await sound.pauseAsync();
                }}
                onSlidingComplete={async (val) => {
                  if (hasSoundPaused) {
                    await sound.setPositionAsync(val);
                  } else {
                    await sound.playFromPositionAsync(val);
                  }
                  dispatch(setSlidingPosition(val));
                  console.log("On Sliding Complete: ", val);
                }}
              />
            </View>
          </View>
          {
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                position: "absolute",
                bottom: 22,
                width: "100%",
              }}
            >
              <Text style={{ marginLeft: 75 }}>
                {msToTime(slidingPosition)}
              </Text>
              <Text
                style={{
                  marginRight: 20,
                }}
              >
                {msToTime(durationMillis - slidingPosition)}
              </Text>
            </View>
          }
        </>
      )}
      
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    flexDirection: "column",
    justifyContent: "center",
  },
  rowBack: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-end",
    justifyContent: "center",
    paddingRight: 10,
  },
  rowFront: {
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    paddingRight: 10,
  },
  actionButton: {
    backgroundColor: "red",
    height: 28,
    width: 50,
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  leftButton: {
    backgroundColor: "red",
    height: 28,
    width: 70,
    justifyContent: "center",
    alignItems: "center",
    margin: 3,
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 10,
  },
  contain: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalView: {
    backgroundColor: "white",
    padding: 20,
    elevation: 4,
    alignItems: "center",
    borderRadius: 25,
  },
  renameInput: {
    fontSize: 15,
    color: "green",
    maxWidth: 200,
    width: 200,
    borderWidth: 0.5,
    borderColor: "green",
    borderRadius: 5,
    padding: 5,
    margin: 10,
  },
});

export default Library;
