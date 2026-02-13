import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './src/screens/HomeScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';

const Stack = createNativeStackNavigator();

// Definición de colores del tema Venered
const THEME = {
  background: '#0f172a', // Slate 900
  primary: '#7e22ce',    // Purple 700
  textPrimary: '#f8fafc',// Slate 50
  border: 'rgba(255, 255, 255, 0.1)',
};

function App(): React.JSX.Element {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
          },
          headerTintColor: THEME.textPrimary,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          headerShadowVisible: false,
          contentStyle: { 
            backgroundColor: THEME.background,
          },
        }}
      >
        <Stack.Screen 
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }} // Ocultamos el header aquí porque ya lo tenemos personalizado
        />
        <Stack.Screen 
          name="CreatePost"
          component={CreatePostScreen}
          options={{
            title: 'Crear nuevo hilo',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;