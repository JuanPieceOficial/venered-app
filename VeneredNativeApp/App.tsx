import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';

const Stack = createNativeStackNavigator();

// Definición de colores del tema Venered
const THEME = {
  background: '#0f172a', 
  primary: '#7e22ce',    
  textPrimary: '#f8fafc',
  border: 'rgba(255, 255, 255, 0.1)',
};

// El stack de la aplicación principal, accesible solo cuando el usuario está logueado
function AppStack() {
  return (
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
          presentation: 'modal', // Las pantallas modales son comunes para creación
        }}
      />
    </Stack.Navigator>
  );
}

function App(): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    // Intentamos obtener la sesión activa al iniciar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escuchamos cambios en el estado de autenticación (login, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // Limpiamos el listener al desmontar el componente
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <NavigationContainer>
      {/* Si hay sesión, muestra la app, si no, muestra la pantalla de login */}
      {session && session.user ? <AppStack /> : <AuthScreen />}
    </NavigationContainer>
  );
}

export default App;