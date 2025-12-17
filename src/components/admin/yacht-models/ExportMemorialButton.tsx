import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { 
  exportToExcel, 
  transformMemorialItemsForExport, 
  generateFilename 
} from "@/lib/export-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleExport}
          disabled={disabled || !items || items.length === 0}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Exportar ({items?.length || 0})</TooltipContent>
    </Tooltip>
  );
}
