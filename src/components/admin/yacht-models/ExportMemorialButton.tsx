import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { 
  exportToExcel, 
  transformMemorialItemsForExport, 
  generateFilename 
} from "@/lib/export-utils";

interface ExportMemorialButtonProps {
  items: any[];
  modelCode: string;
  disabled?: boolean;
}

export function ExportMemorialButton({ items, modelCode, disabled }: ExportMemorialButtonProps) {
  const handleExport = () => {
    if (!items || items.length === 0) {
      toast.error("Nenhum item para exportar");
      return;
    }

    try {
      const exportData = transformMemorialItemsForExport(items);
      const filename = generateFilename("memorial", modelCode);
      exportToExcel(exportData, filename, "Memorial");
      toast.success(`${items.length} itens exportados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao exportar: " + (error as Error).message);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={disabled || !items || items.length === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar
    </Button>
  );
}
