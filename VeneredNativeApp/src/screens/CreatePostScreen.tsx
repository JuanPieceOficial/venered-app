import React, { useState, useLayoutEffect, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';

// Definición de colores del tema Venered
const THEME = {
  background: '#0f172a', 
  card: '#1e293b',       
  primary: '#7e22ce',    
  secondary: '#a855f7',  
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8', 
  border: 'rgba(255, 255, 255, 0.1)',
};

function CreatePostScreen(): React.JSX.Element {
  const [content, setContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const navigation = useNavigation();

  const handlePost = useCallback(async () => {
    if (content.trim().length === 0) return;

    setIsPosting(true);

    // ID de usuario temporal (reemplazar con autenticación real más adelante)
    const tempUserId = 'a48c5e62-fe73-451e-874a-2e3d3b764b38'; 

    const { error } = await supabase
      .from('posts')
      .insert([{ content: content.trim(), user_id: tempUserId }]);

    setIsPosting(false);

    if (error) {
      console.error('Error al publicar:', error);
      Alert.alert('Error', 'No se pudo crear la publicación. Inténtalo de nuevo.');
    } else {
      // Volver a la pantalla de inicio después de publicar
      navigation.goBack();
    }
  }, [content, navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={handlePost}
          disabled={content.trim().length === 0 || isPosting}
          style={[styles.publishButton, (content.trim().length === 0 || isPosting) && styles.disabledButton]}
        >
          {isPosting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.publishButtonText}>Publicar</Text>
          )}
        </TouchableOpacity>
      ),
    });
  }, [navigation, content, isPosting, handlePost]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="¿Qué está pasando?"
          placeholderTextColor={THEME.textSecondary}
          style={styles.textInput}
          multiline
          value={content}
          onChangeText={setContent}
          autoFocus
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  inputContainer: {
    flex: 1,
    padding: 16,
  },
  textInput: {
    flex: 1,
    color: THEME.textPrimary,
    fontSize: 18,
    textAlignVertical: 'top',
  },
  publishButton: {
    backgroundColor: THEME.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  disabledButton: {
    backgroundColor: '#5b21b6', // Un tono más oscuro/apagado de la primary
    opacity: 0.7,
  },
  publishButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CreatePostScreen;