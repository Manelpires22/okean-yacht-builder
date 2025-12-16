import { AdminLayout } from "@/components/AdminLayout";
import { useStats } from "@/hooks/useStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ship, FileText, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const Admin = () => {
  const { data: stats, isLoading } = useStats();

  const cards = [
    {
      title: "Modelos de Iates",
      value: stats?.modelsCount,
      icon: Ship,
      link: "/admin/yacht-models",
      color: "text-primary"
    },
    {
      title: "Cotações",
      value: stats?.quotationsCount,
      icon: FileText,
      link: "#",
      color: "text-muted-foreground"
    },
    {
      title: "Utilizadores",
      value: stats?.usersCount,
      icon: Users,
      link: "/admin/users",
      color: "text-primary"
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-2">Gestão completa do sistema CPQ</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <Link key={card.title} to={card.link}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <card.icon className={cn("h-5 w-5", card.color)} />
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    <div className="text-3xl font-bold">{card.value}</div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default Admin;
