import React from 'react';
import { View, StyleSheet, SafeAreaView, Text } from 'react-native';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../lib/supabase';

// Definición de colores del tema Venered
const THEME = {
  background: '#0f172a', // Slate 900
  card: '#1e293b',       // Slate 800
  primary: '#7e22ce',    // Purple 700
  secondary: '#a855f7',  // Purple 500
  textPrimary: '#f8fafc',// Slate 50
  textSecondary: '#94a3b8', // Slate 400
  border: 'rgba(255, 255, 255, 0.1)',
};

// Adaptación del tema de Venered para el componente Auth de Supabase
const customTheme = {
  ...ThemeSupa,
  default: {
    ...ThemeSupa.default,
    colors: {
      ...ThemeSupa.default.colors,
      brand: THEME.primary,
      brandAccent: THEME.secondary,
      brandButtonText: THEME.textPrimary,
      defaultButtonBackground: THEME.card,
      defaultButtonBackgroundHover: '#334155', // Slate 700
      defaultButtonBorder: THEME.border,
      defaultButtonText: THEME.textPrimary,
      dividerBackground: THEME.border,
      inputBackground: '#020617', // Slate 950
      inputBorder: THEME.border,
      inputBorderHover: THEME.secondary,
      inputBorderFocus: THEME.primary,
      inputText: THEME.textPrimary,
      inputLabelText: THEME.textSecondary,
      inputPlaceholder: THEME.textSecondary,
      messageText: '#dc2626', // Red 600 for errors
      messageTextSuccess: '#16a34a', // Green 600 for success
    },
    space: {
      ...ThemeSupa.default.space,
      buttonPadding: '12px 24px',
      inputPadding: '12px 16px',
    },
    fontSizes: {
      ...ThemeSupa.default.fontSizes,
      baseBodySize: '15px',
      baseInputSize: '15px',
      baseLabelSize: '14px',
    },
    fonts: {
        bodyFont: 'System',
        buttonFont: 'System',
        labelFont: 'System',
    },
    radii: {
        ...ThemeSupa.default.radii,
        borderRadiusButton: '8px',
        inputBorderRadius: '8px',
    }
  },
};

function AuthScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoLetter}>V</Text>
        </View>
        <Text style={styles.title}>Bienvenido a Venered</Text>
        <Text style={styles.subtitle}>Inicia sesión o crea una cuenta para continuar</Text>
      </View>
      <View style={styles.formContainer}>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: customTheme }}
          providers={[]}
          localization={{
            variables: {
              sign_in: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Iniciar Sesión',
                social_provider_text: 'Continuar con {{provider}}',
                link_text: '¿Ya tienes una cuenta? Inicia Sesión',
              },
              sign_up: {
                email_label: 'Correo electrónico',
                password_label: 'Contraseña',
                button_label: 'Crear Cuenta',
                link_text: '¿No tienes una cuenta? Regístrate',
              },
              forgotten_password: {
                email_label: 'Correo electrónico',
                button_label: 'Enviar instrucciones',
                link_text: '¿Olvidaste tu contraseña?',
              },
            },
          }}
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
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  logoCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: THEME.textSecondary,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
});

export default AuthScreen;
