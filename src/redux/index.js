import { createStore, combineReducers } from "redux";

import recordingAudioReducer from "./recording/recordingAudioReducer";
import userReducer from "./user/userReducer";
import languageReducer from "./language/languageReducer";

const allReducers = combineReducers({
    recordingReducer: recordingAudioReducer,
    user: userReducer,
    languageReducer: languageReducer,
})

export default createStore(allReducers);