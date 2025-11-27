import { Card } from "@/components/ui/card";
import { FileText, FileSignature, Users, ListChecks, Settings, Ship } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/admin/UserMenu";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const navigationCards = [
    {
      icon: Ship,
      title: "Configurador",
      path: "/configurador",
    },
    {
      icon: FileText,
      title: "Cotações",
      path: "/cotacoes",
    },
    {
      icon: FileSignature,
      title: "Contratos",
      path: "/contratos",
    },
    {
      icon: Users,
      title: "Clientes",
      path: "/clientes",
    },
    {
      icon: ListChecks,
      title: "Aprovações",
      path: "/aprovacoes",
    },
    {
      icon: Settings,
      title: "Administração",
      path: "/admin",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">OKEAN Yachts</h1>
              <p className="text-sm text-gray-500">Sistema CPQ</p>
            </div>
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-semibold text-gray-900 mb-2">
              Bem-vindo
            </h2>
            <p className="text-gray-600">
              Selecione uma opção para começar
            </p>
          </div>

          {/* Navigation Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {navigationCards.map((item) => {
              const Icon = item.icon;
              return (
                <Card
                  key={item.path}
                  className="bg-white hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200 p-8 flex flex-col items-center justify-center gap-3"
                  onClick={() => navigate(item.path)}
                >
                  <Icon className="h-8 w-8 text-gray-700" strokeWidth={1.5} />
                  <span className="text-sm font-medium text-gray-900">
                    {item.title}
                  </span>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
