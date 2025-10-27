import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'CUSTOM';
  table_name: string | null;
  record_id: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  route: string | null;
  metadata: any;
  created_at: string;
}

interface UseAuditLogsParams {
  userId?: string;
  tableName?: string;
  action?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

export function useAuditLogs(params: UseAuditLogsParams = {}) {
  const {
    userId,
    tableName,
    action,
    startDate,
    endDate,
    page = 1,
    pageSize = 50,
  } = params;

  return useQuery({
    queryKey: ['audit-logs', userId, tableName, action, startDate, endDate, page],
    queryFn: async () => {
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        query = query.lte('created_at', endDate.toISOString());
      }

      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        logs: data as AuditLog[],
        total: count || 0,
        page,
        pageSize,
        totalPages: count ? Math.ceil(count / pageSize) : 0,
      };
    },
  });
}

export function useAuditLogStats() {
  return useQuery({
    queryKey: ['audit-log-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('action, table_name, created_at');

      if (error) throw error;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const stats = {
        totalLogs: data?.length || 0,
        todayLogs: data?.filter(log => new Date(log.created_at) >= today).length || 0,
        actionBreakdown: {} as Record<string, number>,
        tableBreakdown: {} as Record<string, number>,
      };

      data?.forEach(log => {
        stats.actionBreakdown[log.action] = (stats.actionBreakdown[log.action] || 0) + 1;
        if (log.table_name) {
          stats.tableBreakdown[log.table_name] = (stats.tableBreakdown[log.table_name] || 0) + 1;
        }
      });

      return stats;
    },
  });
}

export function exportAuditLogsToCSV(logs: AuditLog[]) {
  const headers = [
    'Data/Hora',
    'Usuário',
    'Email',
    'Ação',
    'Tabela',
    'ID Registro',
    'Campos Alterados',
  ];

  const rows = logs.map(log => [
    format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
    log.user_name || 'Sistema',
    log.user_email || '-',
    log.action,
    log.table_name || '-',
    log.record_id || '-',
    log.changed_fields?.join(', ') || '-',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd-HHmmss')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}