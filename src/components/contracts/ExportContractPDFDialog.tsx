import { useState } from "react";
import { Download, FileText, Layers, ListChecks, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ATO } from "@/hooks/useATOs";

interface ExportContractPDFDialogProps {
  contractId: string;
  contractNumber: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvedATOs: ATO[];
}

type ExportType = "original" | "ato" | "total";

export function ExportContractPDFDialog({
  contractId,
  contractNumber,
  open,
  onOpenChange,
  approvedATOs,
}: ExportContractPDFDialogProps) {
  const [exportType, setExportType] = useState<ExportType>("original");
  const [selectedAtoId, setSelectedAtoId] = useState<string>("all");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleExport = async () => {
    setIsGenerating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.");
        return;
      }

      const payload = {
        contract_id: contractId,
        export_type: exportType,
        ato_id: exportType === "ato" && selectedAtoId !== "all" ? selectedAtoId : null,
      };

      const { data, error } = await supabase.functions.invoke(
        "generate-contract-summary-pdf",
        {
          body: payload,
        }
      );

      if (error) throw error;

      if (data?.pdf_base64) {
        // Decode base64 and download
        const byteCharacters = atob(data.pdf_base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Generate filename based on export type
        let filename = contractNumber;
        if (exportType === "original") {
          filename += "_Contrato_Original";
        } else if (exportType === "ato") {
          if (selectedAtoId === "all") {
            filename += "_Todas_ATOs";
          } else {
            const ato = approvedATOs.find((a) => a.id === selectedAtoId);
            filename += `_${ato?.ato_number.replace(" ", "_") || "ATO"}`;
          }
        } else {
          filename += "_Contrato_Total";
        }
        filename += ".pdf";

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("PDF gerado com sucesso!");
        onOpenChange(false);
      } else {
        throw new Error("PDF não retornado");
      }
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Erro ao gerar PDF. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const getExportDescription = () => {
    switch (exportType) {
      case "original":
        return "PDF do contrato como foi assinado originalmente, incluindo modelo, upgrades, opcionais e customizações aprovadas.";
      case "ato":
        return selectedAtoId === "all"
          ? "PDF com todas as ATOs aprovadas do contrato, cada uma em sua seção."
          : "PDF da ATO selecionada com detalhes de itens e impacto financeiro.";
      case "total":
        return "PDF consolidado incluindo contrato original + todas as ATOs aprovadas + resumo financeiro atualizado.";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar PDF do Contrato
          </DialogTitle>
          <DialogDescription>
            Selecione o tipo de documento que deseja gerar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={exportType}
            onValueChange={(value) => setExportType(value as ExportType)}
            className="space-y-4"
          >
            {/* Opção 1: Contrato Original */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="original" id="original" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="original" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-medium">Contrato Original Aprovado</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Documento do contrato como foi assinado
                </p>
              </div>
            </div>

            {/* Opção 2: ATO */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="ato" id="ato" className="mt-1" />
              <div className="flex-1 space-y-3">
                <Label htmlFor="ato" className="flex items-center gap-2 cursor-pointer">
                  <ListChecks className="h-4 w-4 text-primary" />
                  <span className="font-medium">ATO (Alteração Contratual)</span>
                </Label>
                <p className="text-sm text-muted-foreground">
                  {approvedATOs.length === 0
                    ? "Nenhuma ATO aprovada neste contrato"
                    : `${approvedATOs.length} ATO(s) aprovada(s) disponível(is)`}
                </p>

                {exportType === "ato" && approvedATOs.length > 0 && (
                  <Select value={selectedAtoId} onValueChange={setSelectedAtoId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a ATO" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="font-medium">Todas as ATOs ({approvedATOs.length})</span>
                      </SelectItem>
                      {approvedATOs.map((ato) => (
                        <SelectItem key={ato.id} value={ato.id}>
                          {ato.ato_number} - {ato.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Opção 3: Contrato Total */}
            <div className="flex items-start space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="total" id="total" className="mt-1" />
              <div className="flex-1">
                <Label htmlFor="total" className="flex items-center gap-2 cursor-pointer">
                  <Layers className="h-4 w-4 text-primary" />
                  <span className="font-medium">Contrato Total (Consolidado)</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Contrato original + todas as ATOs + resumo financeiro atualizado
                </p>
              </div>
            </div>
          </RadioGroup>

          {/* Descrição do tipo selecionado */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">{getExportDescription()}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isGenerating || (exportType === "ato" && approvedATOs.length === 0)}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando PDF...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Exportar PDF
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
