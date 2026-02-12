
import { useState, useEffect, useRef } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Send, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import MessageImageUpload from "@/components/MessageImageUpload";

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  receiver_id: string;
  read: boolean;
  image_url?: string;
  reactions?: MessageReaction[];
}

interface MessageReaction {
  id: string;
  emoji: string;
  user_id: string;
}

interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

// Sound notification for new messages
const playNotificationSound = () => {
  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAZBzaGzPPeePP9');
  audio.volume = 0.3;
  audio.play().catch(e => console.log('Could not play notification sound:', e));
};

const Messages = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messageSentToastShown, setMessageSentToastShown] = useState(false);
  const [isRecipientTyping, setIsRecipientTyping] = useState(false);
  const typingTimeoutRef = useRef<number | null>(null);
  const reactionOptions = ["❤️", "😂", "😮", "😢", "🙌"];

  useEffect(() => {
    if (username && user) {
      loadConversation();
    }
  }, [username, user]);

  // Listen for new messages in real-time
  useEffect(() => {
    if (!user || !recipient) return;

    const channel = supabase
      .channel('new-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          if (newMessage.sender_id === recipient.id) {
            setMessages(prev => [...prev, newMessage]);
            playNotificationSound();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipient]);

  useEffect(() => {
    if (!user || !recipient) return;

    const channel = supabase
      .channel('typing-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_typing',
          filter: `receiver_id=eq.${user.id}`
        },
        (payload) => {
          if (payload.new.sender_id === recipient.id) {
            setIsRecipientTyping(payload.new.is_typing);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, recipient]);

  const loadConversation = async () => {
    if (!username || !user) return;

    try {
      // Load recipient profile
      const { data: recipientData, error: recipientError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (recipientError) throw recipientError;
      setRecipient(recipientData);

      // Load messages between current user and recipient
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select(`
          *,
          reactions:message_reactions (
            id,
            emoji,
            user_id
          )
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${recipientData.id}),and(sender_id.eq.${recipientData.id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setMessages(messagesData || []);

      // Mark messages as read
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('sender_id', recipientData.id)
        .eq('receiver_id', user.id)
        .eq('read', false);
    } catch (error: any) {
      console.error('Error loading conversation:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la conversación",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (url: string) => {
    handleSendMessage(null, url);
  };

  const setTypingStatus = async (isTyping: boolean) => {
    if (!user || !recipient) return;

    try {
      await supabase
        .from('message_typing')
        .upsert({
          sender_id: user.id,
          receiver_id: recipient.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  useEffect(() => {
    if (!user || !recipient) return;

    if (typingTimeoutRef.current) {
      window.clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = window.setTimeout(() => {
      setTypingStatus(newMessage.trim().length > 0);
    }, 400);

    return () => {
      if (typingTimeoutRef.current) {
        window.clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [newMessage, user, recipient]);

  const handleSendMessage = async (e: React.FormEvent | null, imageUrl?: string) => {
    if (e) e.preventDefault();
    if ((!newMessage.trim() && !imageUrl) || !recipient || !user || sending) return;

    // Verificar si el usuario sigue al destinatario
    const { data: followData, error: followError } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', recipient.id)
      .maybeSingle();

    if (followError) {
      console.error('Error checking follow status:', followError);
    }

    const isFollowing = !!followData;

    let allowMessages = true;
    if (!isFollowing) {
      const { data: privacyData, error: privacyError } = await supabase
        .from('privacy_settings')
        .select('allow_message_from_strangers')
        .eq('user_id', recipient.id)
        .maybeSingle();

      if (privacyError) {
        console.error('Error checking privacy settings:', privacyError);
      }

      if (privacyData && privacyData.allow_message_from_strangers === false) {
        allowMessages = false;
      }
    }

    if (!isFollowing && !allowMessages) {
      toast({
        title: "No se pudo enviar",
        description: "Este usuario no permite mensajes de desconocidos",
        variant: "destructive"
      });
      return;
    }

    if (!isFollowing && messages.length === 0) {
      // Si no sigue al usuario y no hay mensajes previos, mostrar advertencia solo una vez
      if (!messageSentToastShown) {
        toast({
          title: "Solicitud de mensaje",
          description: "Tu mensaje será enviado como una solicitud ya que no sigues a este usuario",
          variant: "default"
        });
        setMessageSentToastShown(true);
      }
    }

    try {
      setSending(true);
      
      const messageData: any = {
        sender_id: user.id,
        receiver_id: recipient.id
      };

      if (imageUrl) {
        messageData.image_url = imageUrl;
        messageData.content = newMessage.trim() || '';
      } else {
        messageData.content = newMessage.trim();
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData);

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      setNewMessage('');
      setTypingStatus(false);
      loadConversation();
      
      // Show success toast only once per session
      if (!messageSentToastShown) {
        toast({
          title: "¡Mensaje enviado!",
          description: imageUrl ? "Imagen enviada correctamente" : "Mensaje enviado"
        });
        setMessageSentToastShown(true);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo enviar el mensaje",
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    return () => {
      setTypingStatus(false);
    };
  }, [user, recipient]);

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (!user) return;

    const message = messages.find((item) => item.id === messageId);
    const reactions = message?.reactions || [];
    const hasReaction = reactions.some(
      (reaction) => reaction.user_id === user.id && reaction.emoji === emoji
    );

    try {
      if (hasReaction) {
        const { error } = await supabase
          .from('message_reactions')
          .delete()
          .eq('message_id', messageId)
          .eq('user_id', user.id)
          .eq('emoji', emoji);

        if (error) throw error;

        setMessages((prev) =>
          prev.map((item) =>
            item.id === messageId
              ? {
                  ...item,
                  reactions: (item.reactions || []).filter(
                    (reaction) => !(reaction.user_id === user.id && reaction.emoji === emoji)
                  )
                }
              : item
          )
        );
      } else {
        const { data, error } = await supabase
          .from('message_reactions')
          .insert({ message_id: messageId, user_id: user.id, emoji })
          .select('id, emoji, user_id')
          .single();

        if (error) throw error;

        setMessages((prev) =>
          prev.map((item) =>
            item.id === messageId
              ? { ...item, reactions: [...(item.reactions || []), data] }
              : item
          )
        );
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!recipient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Usuario no encontrado</h2>
          <Link to="/feed">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
              Volver al Feed
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
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/feed">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>
            <Avatar className="w-8 h-8">
              <AvatarImage src={recipient.avatar_url || "/placeholder.svg"} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-sm">
                {recipient.full_name?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-white font-semibold">{recipient.full_name}</h2>
              <p className="text-gray-400 text-sm">@{recipient.username}</p>
              {isRecipientTyping && (
                <p className="text-xs text-emerald-400">Escribiendo...</p>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Messages */}
          <div className="space-y-4 mb-4">
            {messages.length > 0 ? (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
                >
                  <Card
                    className={`max-w-xs p-3 ${
                      message.sender_id === user?.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0'
                        : 'bg-gray-800/60 border-gray-600 text-white'
                    }`}
                  >
                    {message.image_url ? (
                      <div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <img
                              src={message.image_url}
                              alt="Imagen"
                              className="w-full rounded-lg mb-2 cursor-pointer hover:opacity-90 transition-opacity"
                            />
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl w-full bg-black/90 border-gray-600">
                            <div className="relative">
                              <img
                                src={message.image_url}
                                alt="Imagen completa"
                                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
                        {message.content && (
                          <p className="text-sm mt-2">{message.content}</p>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm">{message.content}</p>
                    )}
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>

                    {message.reactions && message.reactions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(
                          message.reactions.reduce<Record<string, number>>((acc, reaction) => {
                            acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
                            return acc;
                          }, {})
                        ).map(([emoji, count]) => (
                          <span
                            key={`${message.id}-${emoji}`}
                            className="text-xs bg-black/30 border border-white/10 px-2 py-1 rounded-full"
                          >
                            {emoji} {count}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1 mt-2">
                      {reactionOptions.map((emoji) => (
                        <button
                          key={`${message.id}-${emoji}-react`}
                          type="button"
                          onClick={() => toggleReaction(message.id, emoji)}
                          className="text-xs px-2 py-1 rounded-full bg-white/10 hover:bg-white/20"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </Card>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-400">No hay mensajes aún</p>
                <p className="text-gray-500 text-sm mt-2">Inicia la conversación</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md border-t border-gray-700 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-end space-x-2">
            <MessageImageUpload onImageUploaded={handleImageUpload} />
            <form onSubmit={(e) => handleSendMessage(e)} className="flex space-x-2 flex-1">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || sending}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
