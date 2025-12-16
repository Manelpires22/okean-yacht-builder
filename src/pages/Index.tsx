import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, FileSignature, Users, ListChecks, Settings, Ship, Anchor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { UserMenu } from "@/components/admin/UserMenu";
import { useStats } from "@/hooks/useStats";
import { useWorkflowPendingCount } from "@/hooks/useWorkflowPendingCount";
import { useUserProfile } from "@/hooks/useUserProfile";
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const {
    data: stats,
    isLoading: statsLoading
  } = useStats();
  const {
    data: pendingCount = 0
  } = useWorkflowPendingCount();
  const {
    data: profile
  } = useUserProfile();

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Bom dia";
    if (hour < 18) return "Boa tarde";
    return "Boa noite";
  };
  const firstName = profile?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || "Usuário";
  const quickStats = [{
    label: "Cotações",
    value: stats?.quotationsCount || 0,
    icon: FileText
  }, {
    label: "Contratos",
    value: stats?.contractsCount || 0,
    icon: FileSignature
  }, {
    label: "Modelos",
    value: stats?.modelsCount || 0,
    icon: Ship
  }, {
    label: "Usuários",
    value: stats?.usersCount || 0,
    icon: Users
  }];
  const navigationCards = [{
    icon: Ship,
    title: "Configurador",
    description: "Configure iates com opcionais e personalizações exclusivas",
    path: "/configurador",
    badge: stats?.modelsCount ? `${stats.modelsCount} modelos` : null,
    badgeVariant: "secondary" as const
  }, {
    icon: FileText,
    title: "Cotações",
    description: "Gerencie propostas comerciais e preços",
    path: "/cotacoes",
    badge: stats?.quotationsCount ? `${stats.quotationsCount} ativas` : null,
    badgeVariant: "secondary" as const
  }, {
    icon: FileSignature,
    title: "Contratos",
    description: "Acompanhe contratos, ATOs e entregas",
    path: "/contratos",
    badge: stats?.contractsCount ? `${stats.contractsCount} ativos` : null,
    badgeVariant: "secondary" as const
  }, {
    icon: Users,
    title: "Clientes",
    description: "Cadastro e gestão de clientes",
    path: "/clientes",
    badge: null,
    badgeVariant: "secondary" as const
  }, {
    icon: ListChecks,
    title: "Aprovações",
    description: "Fluxos de aprovação comercial e técnica",
    path: "/aprovacoes",
    badge: pendingCount > 0 ? `${pendingCount} pendentes` : null,
    badgeVariant: "destructive" as const
  }, {
    icon: Settings,
    title: "Administração",
    description: "Configurações e gestão do sistema",
    path: "/admin",
    badge: null,
    badgeVariant: "secondary" as const
  }];
  return <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Anchor className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-foreground">OKEAN Yachts</h1>
                <p className="text-sm text-muted-foreground">Configurador</p>
              </div>
            </div>
            {user && <UserMenu />}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-8">
          
          {/* Personalized Greeting */}
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-semibold text-foreground">
              {getGreeting()}, {firstName}! 👋
            </h2>
            {pendingCount > 0 ? <p className="text-muted-foreground">
                Você tem <span className="text-destructive font-medium">{pendingCount} tarefas pendentes</span>
              </p> : <p className="text-muted-foreground">
                Selecione uma opção para começar
              </p>}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {quickStats.map(stat => {
            const Icon = stat.icon;
            return <Card key={stat.label} className="p-4 bg-background">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      {statsLoading ? <Skeleton className="h-6 w-8" /> : <p className="text-2xl font-bold text-foreground">{stat.value}</p>}
                      <p className="text-xs text-muted-foreground">{stat.label}</p>
                    </div>
                  </div>
                </Card>;
          })}
          </div>

          {/* Navigation Cards Grid */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-foreground">Navegação Rápida</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {navigationCards.map(item => {
              const Icon = item.icon;
              return <Card key={item.path} className="bg-background hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer border group" onClick={() => navigate(item.path)}>
                    <div className="p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                          <Icon className="h-7 w-7 text-primary" strokeWidth={1.5} />
                        </div>
                        {item.badge && <Badge variant={item.badgeVariant} className="text-xs">
                            {item.badge}
                          </Badge>}
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                          {item.title}
                        </h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </Card>;
            })}
            </div>
          </div>
        </div>
      </main>
    </div>;
};
export default Index;