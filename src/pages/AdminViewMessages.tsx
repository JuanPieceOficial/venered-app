
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  image_url?: string;
  sender_profile: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  receiver_profile: {
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const AdminViewMessages = () => {
  const { username } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin && username) {
      loadUserAndMessages();
    }
  }, [isAdmin, username]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('is_admin', { user_id: user.id });
      if (error) throw error;
      setIsAdmin(data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const loadUserAndMessages = async () => {
    try {
      // Obtener información del usuario objetivo
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (userError) throw userError;
      setTargetUser(userProfile);

      // Obtener todos los mensajes donde este usuario esté involucrado
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          sender_id,
          receiver_id,
          created_at,
          image_url,
          sender_profile:profiles!messages_sender_id_fkey (
            username,
            full_name,
            avatar_url
          ),
          receiver_profile:profiles!messages_receiver_id_fkey (
            username,
            full_name,
            avatar_url
          )
        `)
        .or(`sender_id.eq.${userProfile.id},receiver_id.eq.${userProfile.id}`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;
      setMessages(messagesData || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <Shield className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-gray-400 mb-4">No tienes permisos de administrador</p>
          <Link to="/admin">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Volver al Panel Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-700">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/admin">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-purple-500" />
              <h1 className="text-white font-bold text-xl">
                Mensajes de @{targetUser?.username}
              </h1>
            </div>
          </div>
          <div className="bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-sm">
            Solo lectura - Vista de Admin
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4 pb-8">
        <div className="max-w-4xl mx-auto">
          {targetUser && (
            <Card className="bg-gray-800/60 border-gray-600 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={targetUser.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {targetUser.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl">{targetUser.full_name}</h2>
                    <p className="text-gray-400 text-sm">@{targetUser.username}</p>
                  </div>
                </CardTitle>
              </CardHeader>
            </Card>
          )}

          <Card className="bg-gray-800/60 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">
                Historial de Mensajes ({messages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-400">No hay mensajes para mostrar</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div key={message.id} className="p-4 bg-gray-700/50 rounded-lg">
                      <div className="flex items-start space-x-3 mb-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={message.sender_profile.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs">
                            {message.sender_profile.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-white font-medium text-sm">
                              {message.sender_profile.full_name}
                            </span>
                            <span className="text-gray-400 text-xs">
                              → {message.receiver_profile.full_name}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {format(new Date(message.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                            </span>
                          </div>
                          <p className="text-gray-300 text-sm">{message.content}</p>
                          {message.image_url && (
                            <img 
                              src={message.image_url} 
                              alt="Mensaje con imagen" 
                              className="mt-2 max-w-xs rounded-lg"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminViewMessages;
