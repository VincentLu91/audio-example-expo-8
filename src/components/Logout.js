import React from 'react'
import { SafeAreaView, TouchableOpacity } from 'react-native'
import { StyleSheet, ScrollView, Text } from 'react-native'
import { auth } from '../../firebase';
import { navigationRef } from "../../App";
import { useDispatch, useSelector } from "react-redux";
import {
  setRecording,
  setIsRecording,
  setRecordingDuration,
  setSoundStop,
} from "../redux/recording/actions";
import LiveAudioStream from 'react-native-live-audio-stream';

const Logout = ({ navigation }) => {
	const currentSoundPlaying = useSelector(
    	(state) => state.recordingReducer.currentSoundPlaying
  	);
	const recording = useSelector((state) => state.recordingReducer.recording);
	const dispatch = useDispatch();
	
	async function signOutUser (){
		// Stop current playing sound; if any
		if (currentSoundPlaying) {
        	await currentSoundPlaying.unloadAsync();
    	}
		LiveAudioStream.stop();
		if(global.socket) {
      			global.socket.onclose = event => {
        		console.log(event);
        		global.socket = null;
      		}
    	}
		// Stop recording if recording is in progress
		dispatch(setRecording(undefined));
    	dispatch(setIsRecording(false));
    	dispatch(setRecordingDuration(0));
		dispatch(setSoundStop(true));
    	await recording?.stopAndUnloadAsync();

		auth.signOut().then(() => {
			console.log("logging out");
			navigationRef.navigate("Login");
		});
	}
	
	return (
		<SafeAreaView>
			<ScrollView style={styles.container}>
				<Text>Time to sign out</Text>
				<TouchableOpacity
            		activeOpacity={0.8}
            		style={{
              			padding: 5,
              			backgroundColor: "red",
              			margin: 10,
              			borderRadius: 10,
              			height: 45,
              			justifyContent: "center",
            		}}
            onPress={signOutUser}
          >
            <Text style={{ color: "#fff", textAlign: "center" }}>Logout</Text>
          </TouchableOpacity>
			</ScrollView>
		</SafeAreaView>
	);
};

export default Logout

const styles = StyleSheet.create({
	container: {
		height: '100%',
	}
})