
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { supabase } from "@/integrations/supabase/client";

interface Conversation {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  is_following: boolean;
}

const MessagesList = () => {
  const { user } = useAuth();
  const { markAllAsRead } = useUnreadMessages();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .rpc('get_conversations', { p_user_id: user.id });

      if (error) throw error;
      setConversations(data || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <span className="text-white font-bold text-xl">Mensajes</span>
          </div>
          <Link to="/feed">
            <Button variant="ghost" className="text-white hover:bg-white/10">
              Feed
            </Button>
          </Link>
        </div>
      </nav>

      <div className="pt-16 sm:pt-20 px-3 sm:px-4">
        <div className="max-w-2xl mx-auto">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Buscar conversaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Conversations */}
          <div className="space-y-2">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conversation) => (
                <Card key={conversation.id} className="bg-black/40 backdrop-blur-md border-white/20 hover:bg-white/10 transition-colors">
                  <Link to={`/messages/${conversation.username}`} className="block p-4">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={conversation.avatar_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                            {conversation.full_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        {conversation.unread_count > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                            {conversation.unread_count}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-white font-semibold truncate">
                            {conversation.full_name}
                            {!conversation.is_following && (
                              <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">
                                Solicitud
                              </span>
                            )}
                          </h3>
                          <span className="text-gray-400 text-sm">
                            {new Date(conversation.last_message_time).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-gray-400 text-sm truncate">
                          @{conversation.username}
                        </p>
                        <p className="text-gray-300 text-sm truncate mt-1">
                          {conversation.last_message}
                        </p>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white text-lg font-semibold mb-2">No hay conversaciones</h3>
                <p className="text-gray-400">
                  {searchTerm 
                    ? "No se encontraron conversaciones que coincidan con tu búsqueda"
                    : "Comienza una conversación enviando un mensaje a alguien"
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesList;
