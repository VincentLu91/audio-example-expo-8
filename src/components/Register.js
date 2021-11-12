import React, { useLayoutEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { KeyboardAvoidingView } from 'react-native';
import { Button, Input, Text } from 'react-native-elements';
import { StatusBar } from "expo-status-bar";
import { auth } from '../../firebase';
import { LogBox } from 'react-native';

const RegisterScreen = ({ navigation }) => {
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [imageUrl, setImageUrl] = useState('');
	
	useLayoutEffect(() => {
		navigation.setOptions({
			headerBackTitle: 'ABC', // this ONLY shows on iOS at the time of writing this screen
		});
	}, [navigation]);
	
	const register = () => {
		auth
			.createUserWithEmailAndPassword(email, password)
			.then((authUser) => {
				authUser.user.updateProfile({
					displayName: name,
					photoURL: 
						imageUrl || 
						'https://cdn3.iconfinder.com/data/icons/avatars-round-flat/33/avat-01-512.png'
				});	
			})
			.catch((error) => alert(error.message));
		
			// workaround:
			LogBox.ignoreLogs(['Setting a timer']);
	};
	return (
		<KeyboardAvoidingView behavior='padding' style={styles.container}>
			<StatusBar style='light' />
			
			<Text h3 style={{ marginBottom: 50 }}>
				Register here
			</Text>
		
			<View style={styles.inputContainer}>
				<Input 
					placeholder='Full Name' 
					autofocus 
					type='text'
			 		value={name} 
					onChangeText={(text) => setName(text)}
				/>
				<Input 
					placeholder='Email' 
					type='email'
			 		value={email} 
					onChangeText={(text) => setEmail(text)}
				/>
				<Input 
					placeholder='Password' 
					type='password'
					secureTextEntry
			 		value={password} 
					onChangeText={(text) => setPassword(text)}
				/>
				<Input 
					placeholder='Profile Picture URL (optional)' 
					type='text'
			 		value={imageUrl} 
					onChangeText={(text) => setImageUrl(text)}
					onSubmitEditing={register}
				/>
			</View>
					
			<Button
				containerStyle={styles.button}
				raised
				onPress={register}
				title='Register'
			/>
			<View style={{ height: 100 }} />
		</KeyboardAvoidingView>
	);
}

export default RegisterScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		padding: 10,
		backgroundColor: 'white',
	},
	button: {
		width: 200,
		marginTop: 10,
	},
	inputContainer: {
		width: 300,
	},
});