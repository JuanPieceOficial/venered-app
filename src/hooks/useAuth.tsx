
import React, { useState, useEffect, createContext, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  checkUsernameAvailability: (username: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
        } else {
          console.log('Initial session:', session?.user?.email);
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Session error:', error);
      } finally {
        setLoading(false);
      }
    };

    getSession();

    return () => subscription.unsubscribe();
  }, []);

  const checkUsernameAvailability = async (username: string) => {
    try {
      const { data, error } = await supabase.rpc('check_username_availability', {
        username_to_check: username
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking username availability:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, username: string) => {
    try {
      // Check if username is available
      const isUsernameAvailable = await checkUsernameAvailability(username);
      
      if (!isUsernameAvailable) {
        const error = new Error('El nombre de usuario ya está en uso');
        toast({
          title: "Error al registrarse",
          description: "El nombre de usuario ya está en uso",
          variant: "destructive"
        });
        return { error };
      }

      const redirectUrl = `${window.location.origin}/feed`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
            username: username
          }
        }
      });

      if (error) {
        console.error('Signup error:', error);
        toast({
          title: "Error al registrarse",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "¡Registro exitoso!",
          description: "Revisa tu email para confirmar tu cuenta"
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signup error:', error);
      toast({
        title: "Error al registrarse",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in:', email);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Signin error:', error);
        toast({
          title: "Error al iniciar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        console.log('Sign in successful');
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente",
        });
      }

      return { error };
    } catch (error: any) {
      console.error('Signin error:', error);
      toast({
        title: "Error al iniciar sesión",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Signout error:', error);
        toast({
          title: "Error al cerrar sesión",
          description: error.message,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        });
        // Redirigir a la página de inicio después de cerrar sesión
        window.location.href = '/';
      }
    } catch (error: any) {
      console.error('Signout error:', error);
      toast({
        title: "Error al cerrar sesión",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    checkUsernameAvailability
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
