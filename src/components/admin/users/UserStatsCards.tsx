import { Card, CardContent } from '@/components/ui/card';
import { Users, Building2, ShieldCheck, UserPlus } from 'lucide-react';

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  departments: number;
  usersWithMFA: number;
  recentUsers: number;
}

interface UserStatsCardsProps {
  stats: UserStats;
}

export function UserStatsCards({ stats }: UserStatsCardsProps) {
  const cards = [
    {
      title: 'Utilizadores',
      value: stats.totalUsers,
      subtitle: `${stats.activeUsers} ativos, ${stats.inactiveUsers} inativos`,
      icon: Users,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Departamentos',
      value: stats.departments,
      subtitle: 'Áreas distintas',
      icon: Building2,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30',
    },
    {
      title: 'Com MFA Ativo',
      value: stats.usersWithMFA,
      subtitle: `${Math.round((stats.usersWithMFA / stats.totalUsers) * 100) || 0}% do total`,
      icon: ShieldCheck,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Novos (7 dias)',
      value: stats.recentUsers,
      subtitle: 'Utilizadores recentes',
      icon: UserPlus,
      color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30',
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.title}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
