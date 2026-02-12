import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Shield, Ban, UserCheck, Search, Eye, UserPlus, Users, MessageSquare, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import AdminGuard from "@/components/AdminGuard";

interface Profile {
  id: string;
  username: string;
  full_name: string;
  avatar_url?: string;
}

interface BannedUser {
  id: string;
  user_id: string;
  reason?: string;
  banned_at: string;
  expires_at?: string;
  is_active: boolean;
  banned_by: string;
  profiles: Profile;
}

interface AdminStats {
  total_users: number;
  total_posts: number;
  total_messages: number;
  banned_users: number;
  active_users_today: number;
}

const AdminPanel = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [bannedUsers, setBannedUsers] = useState<BannedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [newAdminUsername, setNewAdminUsername] = useState("");
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [stats, setStats] = useState<AdminStats>({
    total_users: 0,
    total_posts: 0,
    total_messages: 0,
    banned_users: 0,
    active_users_today: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadUsers(),
      loadBannedUsers(),
      loadStats()
    ]);
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const [usersCount, postsCount, messagesCount, bannedCount] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('posts').select('*', { count: 'exact', head: true }),
        supabase.from('messages').select('*', { count: 'exact', head: true }),
        supabase.from('banned_users').select('*', { count: 'exact', head: true }).eq('is_active', true)
      ]);

      setStats({
        total_users: usersCount.count || 0,
        total_posts: postsCount.count || 0,
        total_messages: messagesCount.count || 0,
        banned_users: bannedCount.count || 0,
        active_users_today: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadBannedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('banned_users')
        .select(`
          id,
          user_id,
          reason,
          banned_at,
          expires_at,
          is_active,
          banned_by,
          profiles!banned_users_user_id_fkey (
            id,
            username,
            full_name,
                  avatar_url
          )
        `)
        .eq('is_active', true)
        .order('banned_at', { ascending: false });

      if (error) throw error;
      setBannedUsers(data || []);
    } catch (error) {
      console.error('Error loading banned users:', error);
    }
  };

  const banUser = async () => {
    if (!selectedUser || !user) return;

    try {
      let expiresAt = null;
      if (banDuration && banDuration !== 'permanent') {
        const days = parseInt(banDuration);
        expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
      }

      const { error } = await supabase
        .from('banned_users')
        .insert({
          user_id: selectedUser.id,
          banned_by: user.id,
          reason: banReason,
          expires_at: expiresAt
        });

      if (error) throw error;

      toast({
        title: "Usuario baneado",
        description: `${selectedUser.username} ha sido baneado exitosamente.`
      });

      setSelectedUser(null);
      setBanReason("");
      setBanDuration("");
      loadBannedUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error banning user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo banear al usuario",
        variant: "destructive"
      });
    }
  };

  const unbanUser = async (bannedUserId: string) => {
    try {
      const { error } = await supabase
        .from('banned_users')
        .update({ is_active: false })
        .eq('id', bannedUserId);

      if (error) throw error;

      toast({
        title: "Usuario desbaneado",
        description: "El usuario ha sido desbaneado exitosamente."
      });

      loadBannedUsers();
      loadStats();
    } catch (error: any) {
      console.error('Error unbanning user:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo desbanear al usuario",
        variant: "destructive"
      });
    }
  };

  const addAdmin = async () => {
    if (!newAdminUsername.trim()) return;

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newAdminUsername.trim())
        .single();

      if (profileError || !profile) {
        toast({
          title: "Error",
          description: "No se encontró un usuario con ese nombre de usuario",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('admin_roles')
        .insert({
          user_id: profile.id,
          role: 'admin',
          created_by: user?.id
        });

      if (error) throw error;

      toast({
        title: "Administrador agregado",
        description: `Se ha otorgado acceso de administrador a ${newAdminUsername}`
      });

      setNewAdminUsername("");
      setShowAddAdmin(false);
    } catch (error: any) {
      console.error('Error adding admin:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo agregar el administrador",
        variant: "destructive"
      });
    }
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminGuard>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-black">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-md border-b border-gray-700">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-gray-800">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Shield className="w-6 h-6 text-purple-500" />
                <h1 className="text-white font-bold text-xl">Panel de Administrador</h1>
              </div>
            </div>
            <Button
              onClick={() => setShowAddAdmin(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Agregar Admin
            </Button>
          </div>
        </nav>

        <div className="pt-20 px-4 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <Card className="bg-gray-800/60 border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Usuarios Totales</p>
                      <p className="text-white text-2xl font-bold">{stats.total_users}</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/60 border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Publicaciones</p>
                      <p className="text-white text-2xl font-bold">{stats.total_posts}</p>
                    </div>
                    <FileText className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/60 border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Mensajes</p>
                      <p className="text-white text-2xl font-bold">{stats.total_messages}</p>
                    </div>
                    <MessageSquare className="w-8 h-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-800/60 border-gray-600">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Usuarios Baneados</p>
                      <p className="text-white text-2xl font-bold">{stats.banned_users}</p>
                    </div>
                    <Ban className="w-8 h-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800/60 border-gray-600 text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800/60 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Usuarios ({filteredUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredUsers.map((profile) => (
                      <div key={profile.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                            <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                              {profile.full_name?.charAt(0).toUpperCase() || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-white font-medium">{profile.full_name}</p>
                            <p className="text-gray-400 text-sm">@{profile.username}</p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link to={`/admin/messages/${profile.username}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Mensajes
                            </Button>
                          </Link>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() => setSelectedUser(profile)}
                              >
                                <Ban className="w-4 h-4 mr-1" />
                                Banear
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-gray-800 border-gray-600">
                              <DialogHeader>
                                <DialogTitle className="text-white">
                                  Banear Usuario: {selectedUser?.username}
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div>
                                  <label className="text-white text-sm font-medium">Razón del baneo</label>
                                  <Textarea
                                    value={banReason}
                                    onChange={(e) => setBanReason(e.target.value)}
                                    placeholder="Describe la razón del baneo..."
                                    className="bg-gray-700 border-gray-600 text-white mt-2"
                                  />
                                </div>
                                <div>
                                  <label className="text-white text-sm font-medium">Duración</label>
                                  <Select value={banDuration} onValueChange={setBanDuration}>
                                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-2">
                                      <SelectValue placeholder="Seleccionar duración" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-gray-700 border-gray-600">
                                      <SelectItem value="1">1 día</SelectItem>
                                      <SelectItem value="7">1 semana</SelectItem>
                                      <SelectItem value="30">1 mes</SelectItem>
                                      <SelectItem value="permanent">Permanente</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setSelectedUser(null);
                                      setBanReason("");
                                      setBanDuration("");
                                    }}
                                    className="border-gray-600"
                                  >
                                    Cancelar
                                  </Button>
                                  <Button
                                    onClick={banUser}
                                    className="bg-red-500 hover:bg-red-600"
                                    disabled={!banReason.trim()}
                                  >
                                    Confirmar Baneo
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/60 border-gray-600">
                <CardHeader>
                  <CardTitle className="text-white">Usuarios Baneados ({bannedUsers.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {bannedUsers.map((banned) => (
                      <div key={banned.id} className="p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={banned.profiles.avatar_url || "/placeholder.svg"} />
                              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                                {banned.profiles.full_name?.charAt(0).toUpperCase() || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-white font-medium">{banned.profiles.full_name}</p>
                              <p className="text-gray-400 text-sm">@{banned.profiles.username}</p>
                            </div>
                          </div>
                          <Button
                            onClick={() => unbanUser(banned.id)}
                            variant="outline"
                            size="sm"
                            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-white"
                          >
                            <UserCheck className="w-4 h-4 mr-1" />
                            Desbanear
                          </Button>
                        </div>
                        {banned.reason && (
                          <p className="text-gray-300 text-sm mb-2">
                            <strong>Razón:</strong> {banned.reason}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-400">
                          <span>Baneado: {new Date(banned.banned_at).toLocaleDateString()}</span>
                          {banned.expires_at ? (
                            <Badge variant="outline" className="border-orange-500 text-orange-500">
                              Expira: {new Date(banned.expires_at).toLocaleDateString()}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-500 text-red-500">
                              Permanente
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {bannedUsers.length === 0 && (
                      <div className="text-center py-8">
                        <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-400">No hay usuarios baneados</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        <Dialog open={showAddAdmin} onOpenChange={setShowAddAdmin}>
          <DialogContent className="bg-gray-800 border-gray-600">
            <DialogHeader>
              <DialogTitle className="text-white">Agregar Administrador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-white text-sm font-medium">Nombre de usuario</label>
                <Input
                  value={newAdminUsername}
                  onChange={(e) => setNewAdminUsername(e.target.value)}
                  placeholder="usuario"
                  className="bg-gray-700 border-gray-600 text-white mt-2"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddAdmin(false);
                    setNewAdminUsername("");
                  }}
                  className="border-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={addAdmin}
                  className="bg-green-500 hover:bg-green-600"
                  disabled={!newAdminUsername.trim()}
                >
                  Agregar Admin
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminGuard>
  );
};

export default AdminPanel;
