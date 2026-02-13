
import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

/*
// --- TODAS LAS IMPORTACIONES SOSPECHOSAS, DESACTIVADAS TEMPORALMENTE ---
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import HomeScreen from './src/screens/HomeScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import AuthScreen from './src/screens/AuthScreen';
*/

// Componente de prueba ultra-simple
function App(): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>¡La app base funciona!</Text>
      <Text style={styles.text}>El error está en uno de los archivos importados.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  text: {
    color: '#f8fafc',
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  }
});

export default App;
