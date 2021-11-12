import * as React from "react";
import { StyleSheet, View, Text, Button } from "react-native";
import { useSelector } from "react-redux";
// import trainML's config code
import summarize_config from "../api/summarize_config";
import translate_config from "../api/translate_config";
import axios from "axios";
import SelectDropdown from 'react-native-select-dropdown';

function Content(props) {
  const transcriptionText = useSelector(
    (state) => state.languageReducer.transcriptionText
  );

  const [summary, setSummary] = React.useState(null);
  const [translation, setTranslation] = React.useState(null);
  const [language, setLanguage] = React.useState(null);

  const languages = ["Chinese", "German"];

  const getSummary = async () => {
    try {
      const resp = await axios.post(
        `${summarize_config.api_address}${summarize_config.route_path}`
      );
      const summary_text = resp.data["summary_text"];
      console.log(summary_text);
      //console.log(typeof summary_text);
      setSummary(summary_text);
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response);
      } else {
        console.log(error);
      }
    }
  };

  const getTranslation = async (lang) => {
    try {
      const resp = await axios.post(
        `${translate_config.api_address}${translate_config.route_path}`,
        {
          lang,
        }
      );
      const translated_text = resp.data["translated_text"];
      //console.log("Translated text is: ", translated_text);
      setTranslation(translated_text);
    } catch (error) {
      if (error.response) {
        console.log(error.response.status);
        console.log(error.response);
      } else {
        console.log(error);
      }
    }
  };

  //getSummary(); // comment this line when API is turned off
  // the 3 JSX lines that display summary, translation, and the translation button should be commented when API is turned off
  return (
    <View style={styles.container}>
      <Text>{transcriptionText}</Text>
      {/*<Text>Summary is: {summary}</Text>*/}
      <SelectDropdown
        data={languages}
	      onSelect={(selectedItem, index) => {
		      console.log(selectedItem, index);
          //setLanguage(selectedItem); // comment this line when API is turned off
	      }}
      />
      {/*<Button title="Translate" onPress={() => getTranslation(language)} />*/}
      {/*<Text>Translation is: {translation}</Text>*/}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    height: "100%",
  },
});

export default Content;
