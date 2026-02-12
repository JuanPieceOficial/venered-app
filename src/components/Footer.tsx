
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, User, Lock } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const { signIn } = useAuth();

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) throw error;
      
      toast({
        title: "Inicio de sesión exitoso",
        description: "Bienvenido, administrador"
      });
      
      setShowAdminLogin(false);
      setEmail("");
      setPassword("");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Credenciales incorrectas",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-black/80 backdrop-blur-md border-t border-white/10 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo y descripción */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="text-white font-bold text-xl">Venered</span>
            </div>
            <p className="text-gray-400 mb-4 max-w-md">
              La red social del futuro. Conecta, comparte y descubre en una plataforma que combina lo mejor de todas las redes sociales.
            </p>
          </div>

          {/* Enlaces legales */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <div className="space-y-2">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-400 hover:text-white transition-colors block">
                    Términos y Condiciones
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl max-h-96 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Términos y Condiciones</DialogTitle>
                  </DialogHeader>
                  <div className="text-gray-300 space-y-4 text-sm">
                    <h3 className="text-white font-semibold">1. Aceptación de los Términos</h3>
                    <p>Al acceder y usar Venered, aceptas cumplir con estos términos y condiciones.</p>
                    
                    <h3 className="text-white font-semibold">2. Uso de la Plataforma</h3>
                    <p>Te comprometes a usar Venered de manera responsable y respetuosa. No está permitido el contenido ofensivo, spam o actividades ilegales.</p>
                    
                    <h3 className="text-white font-semibold">3. Contenido del Usuario</h3>
                    <p>Eres responsable del contenido que publicas. Venered se reserva el derecho de moderar y eliminar contenido inapropiado.</p>
                    
                    <h3 className="text-white font-semibold">4. Privacidad</h3>
                    <p>Respetamos tu privacidad. Consulta nuestra Política de Privacidad para más detalles sobre cómo manejamos tus datos.</p>
                    
                    <h3 className="text-white font-semibold">5. Modificaciones</h3>
                    <p>Nos reservamos el derecho de modificar estos términos en cualquier momento. Te notificaremos sobre cambios importantes.</p>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <button className="text-gray-400 hover:text-white transition-colors block">
                    Política de Privacidad
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-600 max-w-2xl max-h-96 overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="text-white">Política de Privacidad</DialogTitle>
                  </DialogHeader>
                  <div className="text-gray-300 space-y-4 text-sm">
                    <h3 className="text-white font-semibold">Información que Recopilamos</h3>
                    <p>Recopilamos información que nos proporcionas directamente, como tu nombre, email, y contenido que publicas.</p>
                    
                    <h3 className="text-white font-semibold">Cómo Usamos tu Información</h3>
                    <p>Usamos tu información para proporcionar y mejorar nuestros servicios, personalizar tu experiencia y comunicarnos contigo.</p>
                    
                    <h3 className="text-white font-semibold">Compartir Información</h3>
                    <p>No vendemos ni compartimos tu información personal con terceros, excepto cuando sea necesario para proporcionar nuestros servicios.</p>
                    
                    <h3 className="text-white font-semibold">Seguridad</h3>
                    <p>Implementamos medidas de seguridad para proteger tu información, aunque ningún sistema es completamente seguro.</p>
                    
                    <h3 className="text-white font-semibold">Tus Derechos</h3>
                    <p>Tienes derecho a acceder, corregir o eliminar tu información personal. Contáctanos para ejercer estos derechos.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Acceso Admin */}
          <div>
            <h4 className="text-white font-semibold mb-4">Administración</h4>
            <Dialog open={showAdminLogin} onOpenChange={setShowAdminLogin}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10 hover:border-purple-400 w-full"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  ¿Eres Administrador?
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-600">
                <DialogHeader>
                  <DialogTitle className="text-white flex items-center space-x-2">
                    <Shield className="w-5 h-5 text-purple-500" />
                    <span>Acceso de Administrador</span>
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <Label htmlFor="admin-email" className="text-white">Email</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="admin-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="admin@venered.com"
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="admin-password" className="text-white">Contraseña</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <Input
                        id="admin-password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="pl-10 bg-gray-700 border-gray-600 text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAdminLogin(false)}
                      className="flex-1 border-gray-600"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      {loading ? "Verificando..." : "Iniciar Sesión"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Venered. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
