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
      const exportData = transformOptionsForExport(options);
      const filename = generateFilename("opcionais", modelCode);
      exportToExcel(exportData, filename, "Opcionais");
      toast.success(`${options.length} opcionais exportados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao exportar: " + (error as Error).message);
    }
  };

  const optionsCount = options?.length || 0;

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={disabled || optionsCount === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar ({optionsCount})
    </Button>
  );
}
