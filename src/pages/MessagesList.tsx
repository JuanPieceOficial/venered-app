
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const { user, signOut } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const loadConversations = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_conversations', { p_user_id: user.id });
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

  return (
    <div className="bg-background min-h-screen">
        {!isMobile && <Header />}
        <main className={`max-w-2xl mx-auto ${isMobile ? 'pt-6 pb-20 px-3' : 'pt-24 pb-10 px-4'}`}>
            <h1 className="text-2xl font-bold mb-4">Mensajes</h1>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar conversaciones..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
  
            {loading ? (
               <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredConversations.length > 0 ? (
                  filteredConversations.map((conversation) => (
                    <Card key={conversation.id} className="hover:bg-muted transition-colors">
                      <Link to={`/messages/${conversation.username}`} className="block p-4">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={conversation.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback>{conversation.full_name?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                            </Avatar>
                            {conversation.unread_count > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {conversation.unread_count}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold truncate">
                                {conversation.full_name}
                                {!conversation.is_following && <span className="ml-2 text-xs bg-yellow-500 text-black px-2 py-1 rounded">Solicitud</span>}
                              </h3>
                              <span className="text-muted-foreground text-sm">
                                {new Date(conversation.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-muted-foreground text-sm truncate">@{conversation.username}</p>
                            <p className="text-sm truncate mt-1">{conversation.last_message}</p>
                          </div>
                        </div>
                      </Link>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <MessageCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay conversaciones</h3>
                    <p className="text-muted-foreground">
                      {searchTerm ? "No se encontraron conversaciones." : "Comienza una conversación."}
                    </p>
                  </div>
                )}
              </div>
            )}
        </main>
      {isMobile && <MobileBottomNav onLogout={signOut} />}
    </div>
  );
};

export default MessagesList;
