import { Contract } from "@/hooks/useContracts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ship, Calendar, DollarSign, User, FileText, ArrowLeft, MoreVertical, Download, Mail, Trash2, Hash } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { getContractStatusLabel, getContractStatusColor } from "@/lib/contract-utils";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SendContractEmailDialog } from "./SendContractEmailDialog";
import { AutoSizedValue } from "@/components/ui/auto-sized-value";
import { useContractATOsAggregatedImpact } from "@/hooks/useContractATOsAggregatedImpact";

interface ContractHeroSectionProps {
  contract: Contract;
  onDelete?: () => void;
}

export function ContractHeroSection({ contract, onDelete }: ContractHeroSectionProps) {
  const navigate = useNavigate();
  const { data: userRoleData } = useUserRole();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const { data: atosImpact } = useContractATOsAggregatedImpact(contract.id);
  const atoDeliveryDays = atosImpact?.maxApprovedATOsDeliveryDays || 0;

  const canManageContract = userRoleData?.roles?.some((r: string) =>
    ["administrador", "gerente_comercial"].includes(r)
  );

  const handleExportPDF = async () => {
    try {
      setIsDownloading(true);
      const { data, error } = await supabase.functions.invoke(
        "generate-contract-pdf",
        {
          body: { contract_id: contract.id },
        }
      );

      if (error) throw error;

      // Download the file
      const link = document.createElement("a");
      link.href = `data:application/${data.format};base64,${data.data}`;
      link.download = data.filename;
      link.click();

      toast.success("PDF do resumo gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleExportOriginalPDF = async () => {
    try {
      setIsDownloading(true);
      const { data, error } = await supabase.functions.invoke(
        "generate-original-contract-pdf",
        {
          body: { contract_id: contract.id },
        }
      );

      if (error) throw error;

      // Download the file
      const link = document.createElement("a");
      link.href = `data:application/${data.format};base64,${data.data}`;
      link.download = `contrato-original-${contract.contract_number}.pdf`;
      link.click();

      toast.success("PDF do contrato original gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating original contract PDF:", error);
      toast.error("Erro ao gerar PDF: " + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSendEmail = () => {
    setEmailDialogOpen(true);
  };

  return (
    <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-b">
      <div className="container mx-auto p-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/contracts")}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Contratos
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-4xl font-bold">{contract.contract_number}</h1>
                <p className="text-muted-foreground">
                  Contrato de Construção Naval
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`${getContractStatusColor(contract.status)} text-white px-4 py-2 text-base`}
            >
              {getContractStatusLabel(contract.status)}
            </Badge>

            {canManageContract && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportPDF} disabled={isDownloading}>
                    <Download className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Gerando...' : 'Exportar Resumo Atual (PDF)'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportOriginalPDF} disabled={isDownloading}>
                    <FileText className="mr-2 h-4 w-4" />
                    {isDownloading ? 'Gerando...' : 'Exportar Contrato Original (PDF)'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Email
                  </DropdownMenuItem>
                  {onDelete && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={onDelete}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Deletar Contrato
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-card rounded-lg p-4 border flex-1 min-w-[160px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Ship className="h-4 w-4" />
              <span className="text-sm">Modelo</span>
            </div>
            <AutoSizedValue value={contract.yacht_model?.name || "N/A"} />
          </div>

          <div className="bg-card rounded-lg p-4 border flex-1 min-w-[160px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Cliente</span>
            </div>
            <AutoSizedValue value={contract.client?.name || "N/A"} />
          </div>

          <div className="bg-card rounded-lg p-4 border flex-1 min-w-[160px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Valor Total</span>
            </div>
            <AutoSizedValue value={formatCurrency(contract.current_total_price)} />
          </div>

          <div className="bg-card rounded-lg p-4 border flex-1 min-w-[160px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Hash className="h-4 w-4" />
              <span className="text-sm">Matrícula</span>
            </div>
            <AutoSizedValue value={contract.hull_number?.hull_number || "N/A"} />
          </div>

          <div className="bg-card rounded-lg p-4 border flex-1 min-w-[160px]">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Entrega Prevista</span>
            </div>
            <AutoSizedValue 
              value={contract.hull_number?.estimated_delivery_date
                ? format(
                    addDays(new Date(contract.hull_number.estimated_delivery_date), atoDeliveryDays),
                    "dd/MM/yyyy"
                  )
                : `${contract.current_total_delivery_days + atoDeliveryDays} dias`} 
            />
            {atoDeliveryDays > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                (+{atoDeliveryDays} dias ATOs)
              </p>
            )}
          </div>
        </div>

        {contract.signed_at && (
          <div className="text-sm text-muted-foreground">
            Assinado em {format(new Date(contract.signed_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
            {contract.signed_by_name && ` por ${contract.signed_by_name}`}
          </div>
        )}
      </div>

      <SendContractEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        contractId={contract.id}
        defaultEmail={contract.client?.email}
        defaultName={contract.client?.name}
      />
    </div>
  );
}
