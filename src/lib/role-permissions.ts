/**
 * Sistema Centralizado de Roles e Permissões
 * Define todas as permissões de cada role no sistema
 */

export type AppRole = 
  | 'administrador'
  | 'gerente_comercial'
  | 'comercial'
  | 'producao'
  | 'financeiro'
  | 'pm_engenharia'
  | 'comprador'
  | 'planejador'
  | 'broker'
  | 'diretor_comercial'
  | 'backoffice_comercial';

export type Permission = 
  // Cotações
  | 'quotations:view_all'
  | 'quotations:view_own'
  | 'quotations:create'
  | 'quotations:edit_own'
  | 'quotations:edit_all'
  | 'quotations:delete_own'
  | 'quotations:delete_all'
  | 'quotations:approve'
  | 'quotations:send'
  
  // Clientes
  | 'clients:view'
  | 'clients:create'
  | 'clients:edit'
  | 'clients:delete'
  
  // Aprovações
  | 'approvals:view'
  | 'approvals:review'
  | 'approvals:approve_discount'
  | 'approvals:approve_technical'
  
  // Customizações
  | 'customizations:view'
  | 'customizations:create'
  | 'customizations:review_pm'
  | 'customizations:review_planning'
  | 'customizations:review_supply'
  
  // Workflow
  | 'workflow:view_tasks'
  | 'workflow:complete_tasks'
  
  // Opcionais
  | 'options:view'
  | 'options:create'
  | 'options:edit'
  | 'options:delete'
  
  // Modelos de Iates
  | 'yacht_models:view'
  | 'yacht_models:create'
  | 'yacht_models:edit'
  | 'yacht_models:delete'
  
  // Memorial Descritivo
  | 'memorial:view'
  | 'memorial:edit'
  
  // Usuários
  | 'users:view'
  | 'users:create'
  | 'users:edit'
  | 'users:delete'
  | 'users:manage_roles'
  
  // Configurações
  | 'settings:view'
  | 'settings:edit_discounts'
  | 'settings:edit_approvals'
  | 'settings:edit_workflow'
  
  // Auditoria
  | 'audit:view_logs'
  | 'audit:export_logs'
  
  // Simulações
  | 'simulations:view_mdc'
  
  // Admin
  | 'admin:full_access';

export interface RoleDefinition {
  name: AppRole;
  label: string;
  description: string;
  permissions: Permission[];
  color: string; // Para badges
}

export const ROLE_DEFINITIONS: Record<AppRole, RoleDefinition> = {
  administrador: {
    name: 'administrador',
    label: 'Administrador',
    description: 'Acesso total ao sistema. Pode gerenciar usuários, configurações e aprovar qualquer ação.',
    permissions: ['admin:full_access'], // Implica todas as permissões
    color: 'bg-red-500/10 text-red-500 border-red-500/20'
  },
  
  diretor_comercial: {
    name: 'diretor_comercial',
    label: 'Diretor Comercial',
    description: 'Aprova descontos até 15% e gerencia toda área comercial.',
    permissions: [
      'quotations:view_all',
      'quotations:create',
      'quotations:edit_all',
      'quotations:approve',
      'quotations:send',
      'clients:view',
      'clients:create',
      'clients:edit',
      'clients:delete',
      'approvals:view',
      'approvals:review',
      'approvals:approve_discount',
      'options:view',
      'yacht_models:view',
      'memorial:view',
      'users:view',
      'simulations:view_mdc'
    ],
    color: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  
  gerente_comercial: {
    name: 'gerente_comercial',
    label: 'Gerente Comercial',
    description: 'Gerencia cotações e aprova descontos até 15%. Visualiza relatórios comerciais.',
    permissions: [
      'quotations:view_all',
      'quotations:create',
      'quotations:edit_all',
      'quotations:approve',
      'quotations:send',
      'clients:view',
      'clients:create',
      'clients:edit',
      'approvals:view',
      'approvals:review',
      'approvals:approve_discount',
      'options:view',
      'options:create',
      'options:edit',
      'yacht_models:view',
      'yacht_models:create',
      'yacht_models:edit',
      'memorial:view',
      'memorial:edit',
      'users:view',
      'simulations:view_mdc'
    ],
    color: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  
  comercial: {
    name: 'comercial',
    label: 'Comercial',
    description: 'Cria e edita cotações próprias. Descontos acima de 10% requerem aprovação.',
    permissions: [
      'quotations:view_own',
      'quotations:create',
      'quotations:edit_own',
      'quotations:send',
      'clients:view',
      'clients:create',
      'clients:edit',
      'options:view',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-green-500/10 text-green-500 border-green-500/20'
  },
  
  broker: {
    name: 'broker',
    label: 'Broker',
    description: 'Intermediário externo. Cria cotações mas precisa de aprovação comercial.',
    permissions: [
      'quotations:view_own',
      'quotations:create',
      'clients:view',
      'clients:create',
      'options:view',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
  },
  
  backoffice_comercial: {
    name: 'backoffice_comercial',
    label: 'Backoffice Comercial',
    description: 'Suporte administrativo comercial. Visualiza e edita cotações.',
    permissions: [
      'quotations:view_all',
      'quotations:edit_all',
      'clients:view',
      'clients:create',
      'clients:edit',
      'options:view',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20'
  },
  
  pm_engenharia: {
    name: 'pm_engenharia',
    label: 'PM Engenharia',
    description: 'Gerente de Projetos. Analisa customizações técnicas e define escopo/custos.',
    permissions: [
      'quotations:view_all',
      'customizations:view',
      'customizations:review_pm',
      'workflow:view_tasks',
      'workflow:complete_tasks',
      'options:view',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-orange-500/10 text-orange-500 border-orange-500/20'
  },
  
  comprador: {
    name: 'comprador',
    label: 'Comprador',
    description: 'Departamento de compras. Cotação de fornecedores para customizações.',
    permissions: [
      'customizations:view',
      'customizations:review_supply',
      'workflow:view_tasks',
      'workflow:complete_tasks',
      'options:view'
    ],
    color: 'bg-amber-500/10 text-amber-500 border-amber-500/20'
  },
  
  planejador: {
    name: 'planejador',
    label: 'Planejador',
    description: 'Planejamento de produção. Valida prazos e impacto na fabricação.',
    permissions: [
      'customizations:view',
      'customizations:review_planning',
      'workflow:view_tasks',
      'workflow:complete_tasks',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-teal-500/10 text-teal-500 border-teal-500/20'
  },
  
  producao: {
    name: 'producao',
    label: 'Produção',
    description: 'Acompanha cotações aprovadas e especificações técnicas para fabricação.',
    permissions: [
      'quotations:view_all',
      'options:view',
      'yacht_models:view',
      'memorial:view'
    ],
    color: 'bg-lime-500/10 text-lime-500 border-lime-500/20'
  },
  
  financeiro: {
    name: 'financeiro',
    label: 'Financeiro',
    description: 'Gestão financeira e análise de margens. Aprova descontos sob perspectiva financeira.',
    permissions: [
      'quotations:view_all',
      'quotations:approve',
      'clients:view',
      'options:view',
      'yacht_models:view',
      'memorial:view',
      'approvals:view',
      'approvals:review',
      'audit:view_logs',
      'settings:view',
      'simulations:view_mdc'
    ],
    color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
  }
};

/**
 * Verifica se um role tem uma permissão específica
 */
export function hasPermission(role: AppRole, permission: Permission): boolean {
  const roleDefinition = ROLE_DEFINITIONS[role];
  
  // Admin tem todas as permissões
  if (roleDefinition.permissions.includes('admin:full_access')) {
    return true;
  }
  
  return roleDefinition.permissions.includes(permission);
}

/**
 * Verifica se um usuário (com múltiplos roles) tem uma permissão
 */
export function userHasPermission(userRoles: AppRole[], permission: Permission): boolean {
  return userRoles.some(role => hasPermission(role, permission));
}

/**
 * Retorna todas as permissões de um usuário (sem duplicatas)
 */
export function getUserPermissions(userRoles: AppRole[]): Permission[] {
  const permissions = new Set<Permission>();
  
  userRoles.forEach(role => {
    const roleDefinition = ROLE_DEFINITIONS[role];
    
    // Se tem admin:full_access, retornar todas as permissões
    if (roleDefinition.permissions.includes('admin:full_access')) {
      Object.keys(PERMISSION_LABELS).forEach(p => permissions.add(p as Permission));
      return;
    }
    
    roleDefinition.permissions.forEach(p => permissions.add(p));
  });
  
  return Array.from(permissions);
}

/**
 * Labels humanizados para cada permissão (para UI)
 */
export const PERMISSION_LABELS: Record<Permission, string> = {
  // Cotações
  'quotations:view_all': 'Ver todas as cotações',
  'quotations:view_own': 'Ver apenas suas cotações',
  'quotations:create': 'Criar cotações',
  'quotations:edit_own': 'Editar suas cotações',
  'quotations:edit_all': 'Editar qualquer cotação',
  'quotations:delete_own': 'Deletar suas cotações',
  'quotations:delete_all': 'Deletar qualquer cotação',
  'quotations:approve': 'Aprovar cotações',
  'quotations:send': 'Enviar cotações ao cliente',
  
  // Clientes
  'clients:view': 'Visualizar clientes',
  'clients:create': 'Criar clientes',
  'clients:edit': 'Editar clientes',
  'clients:delete': 'Deletar clientes',
  
  // Aprovações
  'approvals:view': 'Visualizar aprovações',
  'approvals:review': 'Revisar solicitações de aprovação',
  'approvals:approve_discount': 'Aprovar descontos',
  'approvals:approve_technical': 'Aprovar customizações técnicas',
  
  // Customizações
  'customizations:view': 'Visualizar customizações',
  'customizations:create': 'Criar customizações',
  'customizations:review_pm': 'Revisar como PM (escopo/custo)',
  'customizations:review_planning': 'Revisar planejamento (prazos)',
  'customizations:review_supply': 'Revisar compras (cotação)',
  
  // Workflow
  'workflow:view_tasks': 'Ver tarefas do workflow',
  'workflow:complete_tasks': 'Completar tarefas do workflow',
  
  // Opcionais
  'options:view': 'Visualizar opcionais',
  'options:create': 'Criar opcionais',
  'options:edit': 'Editar opcionais',
  'options:delete': 'Deletar opcionais',
  
  // Modelos
  'yacht_models:view': 'Visualizar modelos de iates',
  'yacht_models:create': 'Criar modelos de iates',
  'yacht_models:edit': 'Editar modelos de iates',
  'yacht_models:delete': 'Deletar modelos de iates',
  
  // Memorial
  'memorial:view': 'Visualizar memorial descritivo',
  'memorial:edit': 'Editar memorial descritivo',
  
  // Usuários
  'users:view': 'Visualizar usuários',
  'users:create': 'Criar usuários',
  'users:edit': 'Editar usuários',
  'users:delete': 'Deletar usuários',
  'users:manage_roles': 'Gerenciar roles de usuários',
  
  // Configurações
  'settings:view': 'Visualizar configurações',
  'settings:edit_discounts': 'Editar limites de desconto',
  'settings:edit_approvals': 'Editar fluxo de aprovações',
  'settings:edit_workflow': 'Editar workflow de customizações',
  
  // Auditoria
  'audit:view_logs': 'Visualizar logs de auditoria',
  'audit:export_logs': 'Exportar logs de auditoria',
  
  // Simulações
  'simulations:view_mdc': 'Visualizar análise de margem (MDC)',
  
  // Admin
  'admin:full_access': 'Acesso total ao sistema'
};

/**
 * Categorias de permissões para organização na UI
 */
export const PERMISSION_CATEGORIES = {
  'Cotações': [
    'quotations:view_all',
    'quotations:view_own',
    'quotations:create',
    'quotations:edit_own',
    'quotations:edit_all',
    'quotations:delete_own',
    'quotations:delete_all',
    'quotations:approve',
    'quotations:send'
  ],
  'Clientes': [
    'clients:view',
    'clients:create',
    'clients:edit',
    'clients:delete'
  ],
  'Aprovações': [
    'approvals:view',
    'approvals:review',
    'approvals:approve_discount',
    'approvals:approve_technical'
  ],
  'Customizações & Workflow': [
    'customizations:view',
    'customizations:create',
    'customizations:review_pm',
    'customizations:review_planning',
    'customizations:review_supply',
    'workflow:view_tasks',
    'workflow:complete_tasks'
  ],
  'Catálogo': [
    'options:view',
    'options:create',
    'options:edit',
    'options:delete',
    'yacht_models:view',
    'yacht_models:create',
    'yacht_models:edit',
    'yacht_models:delete',
    'memorial:view',
    'memorial:edit'
  ],
  'Administração': [
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:manage_roles',
    'settings:view',
    'settings:edit_discounts',
    'settings:edit_approvals',
    'settings:edit_workflow',
    'audit:view_logs',
    'audit:export_logs',
    'simulations:view_mdc',
    'admin:full_access'
  ]
} as const;
