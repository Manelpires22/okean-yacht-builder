import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

// Configurar Supabase client
const SUPABASE_URL = "https://qqxhkaowexieednyazwq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeGhrYW93ZXhpZWVkbnlhendxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDcwNzcsImV4cCI6MjA3NjYyMzA3N30.JfpG7lXhJjIcGeISeyYK7pQul9LZoqc2eHmsDkSDKeo";

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

// Tipos
interface Approval {
  id: string;
  quotation_id: string;
  approval_type: 'commercial' | 'technical' | 'discount' | 'customization';
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  request_details?: any;
}

interface MigrationStats {
  total: number;
  migrated: number;
  skipped: number;
  errors: number;
  errorDetails: Array<{ approvalId: string; error: string }>;
}

// Mapear status de aprovação para workflow_status
function mapApprovalToWorkflowStatus(
  approvalType: Approval['approval_type'],
  status: Approval['status']
): string {
  // Rejeições são sempre 'rejected'
  if (status === 'rejected') {
    return 'rejected';
  }

  // Mapear baseado no tipo e status
  if (approvalType === 'commercial') {
    return status === 'approved' ? 'approved_commercial' : 'pending_commercial';
  }

  if (approvalType === 'technical') {
    return status === 'approved' ? 'approved_technical' : 'pending_technical';
  }

  // Para discount ou customization, usar comercial como fallback
  return status === 'approved' ? 'approved_commercial' : 'pending_commercial';
}

// Migrar uma aprovação específica
async function migrateApproval(approval: Approval): Promise<boolean> {
  try {
    const workflowStatus = mapApprovalToWorkflowStatus(
      approval.approval_type,
      approval.status
    );

    // Buscar customização relacionada via request_details
    const customizationId = approval.request_details?.customization_id;

    if (!customizationId) {
      console.warn(`⚠️  Aprovação ${approval.id} não tem customization_id - pulando`);
      return false;
    }

    // Atualizar customização com dados do workflow
    const { error: updateError } = await supabase
      .from('quotation_customizations')
      .update({
        workflow_status: workflowStatus,
        engineering_notes: approval.notes || null,
        reviewed_by: approval.reviewed_by || null,
        reviewed_at: approval.reviewed_at || null,
      })
      .eq('id', customizationId);

    if (updateError) {
      throw new Error(`Erro ao atualizar customização: ${updateError.message}`);
    }

    console.log(
      `✅ Aprovação ${approval.id} migrada → ${workflowStatus} (customização: ${customizationId})`
    );
    return true;
  } catch (error) {
    console.error(`❌ Erro ao migrar aprovação ${approval.id}:`, error);
    throw error;
  }
}

// Função principal de migração
async function migrateApprovalsToSimplified(): Promise<MigrationStats> {
  const stats: MigrationStats = {
    total: 0,
    migrated: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [],
  };

  try {
    console.log('🚀 Iniciando migração de aprovações para workflow simplificado...\n');

    // 1. Buscar todas as aprovações
    const { data: approvals, error: fetchError } = await supabase
      .from('approvals')
      .select('*')
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw new Error(`Erro ao buscar aprovações: ${fetchError.message}`);
    }

    if (!approvals || approvals.length === 0) {
      console.log('ℹ️  Nenhuma aprovação encontrada para migrar.');
      return stats;
    }

    stats.total = approvals.length;
    console.log(`📊 Total de aprovações encontradas: ${stats.total}\n`);

    // 2. Migrar cada aprovação
    for (let i = 0; i < approvals.length; i++) {
      const approval = approvals[i] as unknown as Approval;
      const progress = `[${i + 1}/${stats.total}]`;

      try {
        console.log(`${progress} Migrando aprovação ${approval.id}...`);

        const migrated = await migrateApproval(approval);

        if (migrated) {
          stats.migrated++;
        } else {
          stats.skipped++;
        }

        // Delay para evitar rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        stats.errors++;
        const errorMessage = error instanceof Error ? error.message : String(error);
        stats.errorDetails.push({
          approvalId: approval.id,
          error: errorMessage,
        });
        console.error(`${progress} ❌ Erro:`, errorMessage);
      }
    }

    // 3. Relatório final
    console.log('\n' + '='.repeat(60));
    console.log('📈 RESUMO DA MIGRAÇÃO');
    console.log('='.repeat(60));
    console.log(`Total de aprovações: ${stats.total}`);
    console.log(`✅ Migradas com sucesso: ${stats.migrated}`);
    console.log(`⏭️  Puladas: ${stats.skipped}`);
    console.log(`❌ Erros: ${stats.errors}`);

    if (stats.errorDetails.length > 0) {
      console.log('\n🔍 DETALHES DOS ERROS:');
      stats.errorDetails.forEach(({ approvalId, error }) => {
        console.log(`  • ${approvalId}: ${error}`);
      });
    }

    console.log('='.repeat(60) + '\n');

    return stats;
  } catch (error) {
    console.error('💥 Erro fatal durante migração:', error);
    throw error;
  }
}

// Executar script
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateApprovalsToSimplified()
    .then((stats) => {
      const exitCode = stats.errors > 0 ? 1 : 0;
      process.exit(exitCode);
    })
    .catch((error) => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

export { migrateApprovalsToSimplified, type MigrationStats };
