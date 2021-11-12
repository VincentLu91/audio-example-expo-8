import * as React from "react";
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Dimensions,
} from "react-native";
import Header from "./Header";
import { getData } from "../data-helpers/helper-functions";
import { useDispatch } from "react-redux";
import { updateRecordingList } from "../redux/recording/actions";
import { Feather } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import Library from './Library';
import AudioRecording from './AudioRecording';
import Content from './Content';
import Logout from './Logout';

const Tab = createBottomTabNavigator();

export default function Home() {
  const dispatch = useDispatch();

  // read the data first
  React.useEffect(() => {
    // define logic for reading recordings
    getData().then((dataReturned) => {
      dispatch(updateRecordingList(dataReturned));
    });
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Header />
      <NavigationContainer independent={true}>
        <Tab.Navigator>
          <Tab.Screen name="Library" component={Library} options={{headerShown: false, tabBarIcon: ({color}) => <Feather name="box" size={24} color={color}/>, tabBarActiveTintColor: 'green', tabBarInactiveTintColor: 'black', }} />
          <Tab.Screen name="AudioRecording" component={AudioRecording} options={{headerShown: false, tabBarIcon: ({color}) => <FontAwesome5 name="microphone" size={24} color={color}/>, tabBarActiveTintColor: 'green', tabBarInactiveTintColor: 'black',}} />
          {/*<Tab.Screen name="Content" component={Content} options={{headerShown: false, tabBarIcon: ({color}) => <FontAwesome5 name="microphone" size={24} color={color}/>, tabBarActiveTintColor: 'green', tabBarInactiveTintColor: 'black',}} />*/}
          <Tab.Screen name="Logout" component={Logout} options={{ tabBarIcon: ({color}) => <FontAwesome5 name="bolt" size={24} color={color}/>, tabBarActiveTintColor: 'green', tabBarInactiveTintColor: 'black',}} />
        </Tab.Navigator>
      </NavigationContainer>
      <ExpoStatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    height:
      Dimensions.get("window").height -
      (Platform.OS === "android" ? StatusBar.currentHeight : 0),
    width: Dimensions.get("window").width,
    marginTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
});
