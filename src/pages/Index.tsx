import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, Settings, Users, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStats } from "@/hooks/useStats";
import { Skeleton } from "@/components/ui/skeleton";

const Index = () => {
  const navigate = useNavigate();
  const { data: stats, isLoading } = useStats();

  const mainFeatures = [
    {
      icon: Ship,
      title: "Configurador de Iates",
      description: "Configure seu iate OKEAN com opcionais e customizações",
      action: () => navigate("/configurador"),
      color: "text-primary"
    },
    {
      icon: FileText,
      title: "Cotações",
      description: "Gerencie cotações e propostas comerciais",
      action: () => navigate("/cotacoes"),
      color: "text-secondary"
    },
    {
      icon: Settings,
      title: "Aprovações",
      description: "Aprove descontos e customizações",
      action: () => navigate("/aprovacoes"),
      color: "text-accent"
    },
    {
      icon: Users,
      title: "Administração",
      description: "Gerencie catálogo, regras e usuários",
      action: () => navigate("/admin"),
      color: "text-muted-foreground"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary">OKEAN Yachts</h1>
              <p className="text-sm text-muted-foreground">Sistema de Configuração CPQ</p>
            </div>
            <Button variant="outline">Login</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            Configure Seu Iate dos Sonhos
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Sistema completo para configuração, precificação e gestão de vendas de iates personalizados
          </p>
          <Button size="lg" className="text-lg px-8" onClick={() => navigate("/configurador")}>
            Começar Configuração
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {mainFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-1 border-2 hover:border-primary/50"
                onClick={feature.action}
              >
                <CardHeader>
                  <Icon className={`w-12 h-12 mb-4 ${feature.color} group-hover:scale-110 transition-transform`} />
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="ghost" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Acessar →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center bg-primary text-primary-foreground">
            <CardHeader>
              {isLoading ? (
                <Skeleton className="h-12 w-16 mx-auto bg-primary-foreground/20" />
              ) : (
                <CardTitle className="text-4xl font-bold">{stats?.modelsCount || 0}</CardTitle>
              )}
              <CardDescription className="text-primary-foreground/80">Modelos Disponíveis</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center bg-secondary text-secondary-foreground">
            <CardHeader>
              {isLoading ? (
                <Skeleton className="h-12 w-16 mx-auto bg-secondary-foreground/20" />
              ) : (
                <CardTitle className="text-4xl font-bold">{stats?.categoriesCount || 0}</CardTitle>
              )}
              <CardDescription className="text-secondary-foreground/80">Categorias</CardDescription>
            </CardHeader>
          </Card>
          <Card className="text-center bg-accent text-accent-foreground">
            <CardHeader>
              {isLoading ? (
                <Skeleton className="h-12 w-16 mx-auto bg-accent-foreground/20" />
              ) : (
                <CardTitle className="text-4xl font-bold">{stats?.optionsCount || 0}</CardTitle>
              )}
              <CardDescription className="text-accent-foreground/80">Opcionais</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
