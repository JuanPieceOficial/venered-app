
import { useState } from "react";
import { Search, UserPlus, UserMinus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFollow } from "@/hooks/useFollow";
import { useIsMobile } from "@/hooks/use-mobile";

interface SearchUser {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  followers_count: number;
  bio?: string;
  isFollowing?: boolean;
}

interface UserSearchProps {
  onUserSelect?: (user: SearchUser) => void;
}

const UserSearch = ({ onUserSelect }: UserSearchProps) => {
  const { user } = useAuth();
  const { followUser, unfollowUser, checkIfFollowing, loading: followLoading } = useFollow();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const searchUsers = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setIsOpen(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, followers_count, bio')
        .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
        .limit(10);

      if (error) throw error;

      // Check if current user follows each search result
      const resultsWithFollowStatus = await Promise.all(
        (data || []).map(async (searchUser) => {
          if (user && user.id !== searchUser.id) {
            const isFollowing = await checkIfFollowing(searchUser.id);
            return { ...searchUser, isFollowing };
          }
          return searchUser;
        })
      );

      setResults(resultsWithFollowStatus);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async (targetUser: SearchUser) => {
    if (!user || user.id === targetUser.id) return;

    const success = targetUser.isFollowing 
      ? await unfollowUser(targetUser.id)
      : await followUser(targetUser.id);

    if (success.success) {
      // Update the user's follow status in results
      setResults(prev => prev.map(u => 
        u.id === targetUser.id 
          ? { ...u, isFollowing: !u.isFollowing }
          : u
      ));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    searchUsers(value);
  };

  const handleResultClick = (searchUser: SearchUser) => {
    setIsOpen(false);
    setSearchTerm("");
    onUserSelect?.(searchUser);
  };

  return (
    <div className={`relative ${isMobile ? 'w-full' : 'w-full max-w-md'}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Buscar usuarios..."
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => searchTerm && setIsOpen(true)}
          onBlur={() => {
            // Delay closing to allow for clicks on results
            setTimeout(() => setIsOpen(false), 200);
          }}
          className={`pl-10 bg-gray-800/60 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500/20 ${
            isMobile ? 'text-base' : 'text-sm'
          }`}
        />
      </div>

      {loading && isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-lg mt-1 p-4 z-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto"></div>
          </div>
        </div>
      )}

      {results.length > 0 && isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-lg mt-1 max-h-96 overflow-y-auto z-50">
          {results.map((searchUser) => (
            <div 
              key={searchUser.id} 
              className="p-3 hover:bg-gray-800/50 transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="flex items-center justify-between">
                <Link 
                  to={`/user/${searchUser.username}`} 
                  className="flex items-center space-x-3 flex-1 min-w-0"
                  onClick={() => handleResultClick(searchUser)}
                >
                  <Avatar className={`${isMobile ? 'w-12 h-12' : 'w-10 h-10'} flex-shrink-0`}>
                    <AvatarImage src={searchUser.avatar_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      {searchUser.full_name?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-white flex-1 min-w-0">
                    <h3 className={`font-semibold truncate ${isMobile ? 'text-base' : 'text-sm'}`}>
                      {searchUser.full_name}
                    </h3>
                    <p className={`text-gray-400 truncate ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      @{searchUser.username}
                    </p>
                    {searchUser.bio && (
                      <p className={`text-gray-500 truncate ${isMobile ? 'text-sm' : 'text-xs'}`}>
                        {searchUser.bio}
                      </p>
                    )}
                    <p className={`text-gray-500 ${isMobile ? 'text-sm' : 'text-xs'}`}>
                      {searchUser.followers_count} seguidores
                    </p>
                  </div>
                </Link>

                {user && user.id !== searchUser.id && (
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleFollowToggle(searchUser);
                    }}
                    disabled={followLoading}
                    size="sm"
                    className={`flex-shrink-0 ml-2 ${
                      searchUser.isFollowing 
                        ? "bg-gray-600 hover:bg-gray-700 text-white" 
                        : "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    } ${isMobile ? 'px-3 py-2 text-sm' : 'px-2 py-1 text-xs'}`}
                  >
                    {searchUser.isFollowing ? (
                      <>
                        <UserMinus className={`${isMobile ? 'w-4 h-4 mr-1' : 'w-3 h-3 mr-1'}`} />
                        {isMobile ? 'Siguiendo' : 'Siguiendo'}
                      </>
                    ) : (
                      <>
                        <UserPlus className={`${isMobile ? 'w-4 h-4 mr-1' : 'w-3 h-3 mr-1'}`} />
                        {isMobile ? 'Seguir' : 'Seguir'}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {searchTerm && !loading && results.length === 0 && isOpen && (
        <div className="absolute top-full left-0 right-0 bg-gray-900/95 backdrop-blur-md border border-gray-600 rounded-lg mt-1 p-4 z-50">
          <p className="text-gray-400 text-center">No se encontraron usuarios</p>
        </div>
      )}
    </div>
  );
};

export default UserSearch;
