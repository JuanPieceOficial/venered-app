import React, { useEffect, useState, useCallback } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

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

interface Post {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    username: string;
    avatar_url: string;
  };
}

const PostCard = ({ item }: { item: Post }) => {
  const username = item.profiles?.username || 'Usuario';
  const initial = username.charAt(0).toUpperCase();

  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.usernameText}>@{username}</Text>
          <Text style={styles.postTime}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
      <Text style={styles.postContent}>{item.content}</Text>
      <View style={styles.postFooter}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>💬 Responder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function HomeScreen(): React.JSX.Element {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching posts:', error);
    } else {
      setPosts(data || []);
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Usamos useFocusEffect para recargar los posts cada vez que la pantalla obtiene el foco
  useFocusEffect(
    useCallback(() => {
      fetchPosts();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPosts();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
    // El listener en App.tsx se encargará de redirigir
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={THEME.primary} />
      
      <View style={styles.navbar}>
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoLetter}>V</Text>
          </View>
          <Text style={styles.brandName}>Venered</Text>
        </View>
        <View style={styles.navActions}>
            <TouchableOpacity style={styles.newPostBtn} onPress={() => navigation.navigate('CreatePost')}>
              <Text style={styles.newPostBtnText}>+</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
              <Text style={styles.signOutBtnText}>Salir</Text>
            </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {loading && !refreshing ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={THEME.secondary} />
            <Text style={styles.loadingText}>Cargando hilos...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listPadding}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={THEME.secondary}
              />
            }
            renderItem={({ item }) => <PostCard item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No hay nada por aquí... todavía.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  navbar: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.border,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
  },
    navActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  logoLetter: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  brandName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  newPostBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  newPostBtnText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '300',
  },
    signOutBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: THEME.card,
    marginLeft: 16,
  },
  signOutBtnText: {
    color: THEME.textSecondary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: THEME.textSecondary,
    marginTop: 12,
  },
  listPadding: {
    padding: 12,
  },
  postCard: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  postHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  headerInfo: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  usernameText: {
    color: THEME.secondary,
    fontWeight: '700',
    fontSize: 15,
  },
  postTime: {
    color: THEME.textSecondary,
    fontSize: 12,
  },
  postContent: {
    color: THEME.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  postFooter: {
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: THEME.border,
    paddingTop: 10,
  },
  actionButton: {
    alignSelf: 'flex-start',
  },
  actionText: {
    color: THEME.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  emptyText: {
    color: THEME.textSecondary,
    fontSize: 16,
  },
});

export default HomeScreen;