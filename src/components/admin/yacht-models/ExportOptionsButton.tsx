import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { 
  exportToExcel, 
  transformOptionsForExport, 
  generateFilename 
} from "@/lib/export-utils";

interface ExportOptionsButtonProps {
  options: any[];
  modelCode: string;
  disabled?: boolean;
}

export function ExportOptionsButton({ options, modelCode, disabled }: ExportOptionsButtonProps) {
  const handleExport = () => {
    if (!options || options.length === 0) {
      toast.error("Nenhum opcional para exportar");
      return;
    }

    try {
      // Filter only model-specific options (not global)
      const modelOptions = options.filter(opt => opt.yacht_model_id);
      
      if (modelOptions.length === 0) {
        toast.error("Este modelo não possui opcionais específicos para exportar");
        return;
      }

      const exportData = transformOptionsForExport(modelOptions);
      const filename = generateFilename("opcionais", modelCode);
      exportToExcel(exportData, filename, "Opcionais");
      toast.success(`${modelOptions.length} opcionais exportados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao exportar: " + (error as Error).message);
    }
  };

  const modelSpecificCount = options?.filter(opt => opt.yacht_model_id)?.length || 0;

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={disabled || modelSpecificCount === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar ({modelSpecificCount})
    </Button>
  );
}
