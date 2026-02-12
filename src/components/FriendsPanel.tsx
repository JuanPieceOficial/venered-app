
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Search, MessageCircle } from 'lucide-react';
import { useFriendship } from '@/hooks/useFriendship';
import { Link } from 'react-router-dom';

interface Friend {
  friendship: any;
  friend: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
}

const FriendsPanel = () => {
  const { getFriends } = useFriendship();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<Friend[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFriends();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = friends.filter(({ friend }) =>
        friend.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        friend.username.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends(friends);
    }
  }, [searchTerm, friends]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      const friendsList = await getFriends();
      setFriends(friendsList);
    } catch (error) {
      console.error('Error loading friends:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/40 backdrop-blur-md border-white/20">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-black/40 backdrop-blur-md border-white/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="w-5 h-5" />
          Amigos ({friends.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar amigos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
          />
        </div>

        {/* Lista de amigos */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredFriends.length > 0 ? (
            filteredFriends.map(({ friend, friendship }) => (
              <div
                key={friend.id}
                className="flex items-center space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              >
                <Avatar className="w-10 h-10">
                  <AvatarImage src={friend.avatar_url || "/placeholder.svg"} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                    {friend.full_name?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${friend.username}`}>
                    <p className="text-white font-medium hover:text-gray-300 truncate">
                      {friend.full_name}
                    </p>
                  </Link>
                  <p className="text-gray-400 text-sm truncate">
                    @{friend.username}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                    Amigo
                  </Badge>
                  <Link to={`/messages/${friend.username}`}>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/20 p-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6">
              <Users className="w-12 h-12 text-gray-500 mx-auto mb-3" />
              <p className="text-gray-400">
                {searchTerm ? 'No se encontraron amigos' : 'Aún no tienes amigos'}
              </p>
              <p className="text-gray-500 text-sm mt-1">
                {!searchTerm && 'Cuando alguien te siga y tú lo sigas de vuelta, se convertirán en amigos automáticamente'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FriendsPanel;
