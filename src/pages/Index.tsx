
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowDown, Users, MessageCircle, Image } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import Footer from "@/components/Footer";

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="text-white font-bold text-xl">Venered</span>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <Link to="/feed">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Feed
                  </Button>
                </Link>
                <Link to="/profile">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Perfil
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/feed">
                  <Button variant="ghost" className="text-white hover:bg-white/10">
                    Explorar
                  </Button>
                </Link>
                <Link to="/feed">
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Iniciar Sesión
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 px-3 sm:px-4">
        <div className="container mx-auto text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold text-white mb-6 bg-gradient-to-r from-emerald-300 via-cyan-300 to-indigo-300 bg-clip-text text-transparent">
              Venered
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              La red social del futuro. Conecta, comparte y descubre en una plataforma que combina lo mejor de todas las redes sociales.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/feed">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-8 py-4 rounded-full"
                >
                  Unirse a Venered
                </Button>
              </Link>
              <Link to="/feed">
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4 rounded-full"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 px-3 sm:px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl font-bold text-white text-center mb-16">
            Todo en una sola plataforma
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-black/30 backdrop-blur-md border-white/20 p-8 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Conecta</h3>
              <p className="text-gray-300">
                Sistema de amigos avanzado, solicitudes inteligentes y conexiones significativas con personas afines.
              </p>
            </Card>

            <Card className="bg-black/30 backdrop-blur-md border-white/20 p-8 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Comunica</h3>
              <p className="text-gray-300">
                Mensajería instantánea, historias que expiran y comunicación fluida con tu círculo social.
              </p>
            </Card>

            <Card className="bg-black/30 backdrop-blur-md border-white/20 p-8 hover:scale-105 transition-transform duration-300">
              <div className="w-16 h-16 bg-gradient-to-r from-pink-500 to-red-500 rounded-full flex items-center justify-center mb-6">
                <Image className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">Comparte</h3>
              <p className="text-gray-300">
                Fotos increíbles, publicaciones con texto y contenido que conecte con tu comunidad.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-3 sm:px-4">
        <div className="container mx-auto text-center">
          <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md rounded-3xl p-12 border border-white/20">
            <h2 className="text-4xl font-bold text-white mb-6">
              ¿Listo para unirte a la revolución social?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Sé parte de la próxima generación de redes sociales
            </p>
            <Link to="/feed">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-lg px-12 py-4 rounded-full"
              >
                Únete a Venered
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Scroll Indicator */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2">
        <ArrowDown className="w-6 h-6 text-white/50 animate-bounce" />
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Index;
