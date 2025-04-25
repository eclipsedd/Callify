import 'react-native-gesture-handler';
import React, {useState} from 'react';
import {View} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import LoginScreen from './src/screens/LoginScreen';
import CallScreen from './src/screens/CallScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [username, setUsername] = useState('');

  return (
    <NavigationContainer>
      <View testID="app-container" style={{flex: 1}}>
        <Stack.Navigator initialRouteName="Login">
          <Stack.Screen name="Login" options={{title: 'Callify Login'}}>
            {props => (
              <LoginScreen
                {...props}
                onLogin={uname => {
                  setUsername(uname);
                  props.navigation.navigate('Call');
                }}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Call" options={{title: 'Callify Call'}}>
            {props => <CallScreen {...props} username={username} />}
          </Stack.Screen>
        </Stack.Navigator>
      </View>
    </NavigationContainer>
  );
};

export default App;
