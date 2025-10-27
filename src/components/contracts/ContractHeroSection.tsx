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
import { Ship, Calendar, DollarSign, User, FileText, ArrowLeft, MoreVertical, Download, Mail } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { getContractStatusLabel, getContractStatusColor } from "@/lib/contract-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SendContractEmailDialog } from "./SendContractEmailDialog";

interface ContractHeroSectionProps {
  contract: Contract;
}

export function ContractHeroSection({ contract }: ContractHeroSectionProps) {
  const navigate = useNavigate();
  const { data: userRoleData } = useUserRole();
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

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

      toast.success("PDF gerado com sucesso!");
    } catch (error: any) {
      console.error("Error generating PDF:", error);
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
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Enviar por Email
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Ship className="h-4 w-4" />
              <span className="text-sm">Modelo</span>
            </div>
            <p className="font-semibold text-lg">
              {contract.yacht_model?.name || "N/A"}
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <User className="h-4 w-4" />
              <span className="text-sm">Cliente</span>
            </div>
            <p className="font-semibold text-lg">
              {contract.client?.name || "N/A"}
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Valor Total</span>
            </div>
            <p className="font-semibold text-lg">
              {formatCurrency(contract.current_total_price)}
            </p>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Prazo Total</span>
            </div>
            <p className="font-semibold text-lg">
              {contract.current_total_delivery_days} dias
            </p>
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
