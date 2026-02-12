
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserPlus, LogIn, ArrowLeft, Loader2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

interface AuthGuardProps {
  children: React.ReactNode;
}

const AuthGuard = ({ children }: AuthGuardProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Si el usuario está autenticado y está en la página de inicio, redirigir al feed
    if (user && !loading) {
      if (location.pathname === '/' || location.pathname === '/auth') {
        navigate('/feed', { replace: true });
        return;
      }
    }
  }, [user, loading, navigate, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Si el usuario está autenticado, mostrar el contenido
  if (user) {
    return <>{children}</>;
  }

  // Si no está autenticado, mostrar el formulario de login
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors mb-6">
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
          <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Venered</h1>
          <p className="text-muted-foreground">Accede para continuar</p>
        </div>

        <Card className="bg-card/60 backdrop-blur-md border-border">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-muted/60 border-border m-4">
              <TabsTrigger value="login" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Iniciar sesión
              </TabsTrigger>
              <TabsTrigger value="register" className="text-foreground data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                Registrarse
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="p-6 pt-0">
              <LoginForm />
            </TabsContent>

            <TabsContent value="register" className="p-6 pt-0">
              <RegisterForm />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

const LoginForm = () => {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const { error } = await signIn(email, password);
    
    if (!error) {
      // No necesitamos navegar manualmente aquí,
      // el useEffect en AuthGuard manejará la redirección
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email" className="text-foreground">Email</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="tu@email.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password" className="text-foreground">Contraseña</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="••••••••"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Iniciando sesión...
          </>
        ) : (
          <>
            <LogIn className="w-4 h-4 mr-2" />
            Iniciar sesión
          </>
        )}
      </Button>
    </form>
  );
};

const RegisterForm = () => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!fullName.trim()) {
      newErrors.push("El nombre completo es requerido");
    }
    
    if (!username.trim()) {
      newErrors.push("El nombre de usuario es requerido");
    }
    
    if (!email.trim()) {
      newErrors.push("El email es requerido");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.push("El formato del email es inválido");
    }
    
    if (!password) {
      newErrors.push("La contraseña es requerida");
    } else if (password.length < 6) {
      newErrors.push("La contraseña debe tener al menos 6 caracteres");
    }
    
    if (password !== confirmPassword) {
      newErrors.push("Las contraseñas no coinciden");
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors([]);
    
    const { error } = await signUp(email, password, fullName, username);
    
    if (error) {
      setErrors([error.message]);
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.length > 0 && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
          {errors.map((error, index) => (
            <p key={index} className="text-red-300 text-sm">{error}</p>
          ))}
        </div>
      )}
      
      <div>
        <Label htmlFor="fullName" className="text-foreground">Nombre completo</Label>
        <Input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="Tu nombre completo"
          required
        />
      </div>
      <div>
        <Label htmlFor="username" className="text-foreground">Nombre de usuario</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="@tunombredeusuario"
          required
        />
      </div>
      <div>
        <Label htmlFor="registerEmail" className="text-foreground">Email</Label>
        <Input
          id="registerEmail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="tu@email.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="registerPassword" className="text-foreground">Contraseña</Label>
        <Input
          id="registerPassword"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="••••••••"
          required
        />
      </div>
      <div>
        <Label htmlFor="confirmPassword" className="text-foreground">Confirmar contraseña</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="bg-input border-border text-foreground placeholder:text-muted-foreground focus:border-ring"
          placeholder="••••••••"
          required
        />
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creando cuenta...
          </>
        ) : (
          <>
            <UserPlus className="w-4 h-4 mr-2" />
            Crear cuenta
          </>
        )}
      </Button>
    </form>
  );
};

export default AuthGuard;
