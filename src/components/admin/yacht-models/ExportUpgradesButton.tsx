import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { 
  exportToExcel, 
  transformUpgradesForExport, 
  generateFilename 
} from "@/lib/export-utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExportUpgradesButtonProps {
  upgrades: any[];
  modelCode: string;
  disabled?: boolean;
}

export function ExportUpgradesButton({ upgrades, modelCode, disabled }: ExportUpgradesButtonProps) {
  const handleExport = () => {
    if (!upgrades || upgrades.length === 0) {
      toast.error("Nenhum upgrade para exportar");
      return;
    }

    try {
      const exportData = transformUpgradesForExport(upgrades);
      const filename = generateFilename("upgrades", modelCode);
      exportToExcel(exportData, filename, "Upgrades");
      toast.success(`${upgrades.length} upgrades exportados com sucesso!`);
    } catch (error) {
      toast.error("Erro ao exportar: " + (error as Error).message);
    }
  };

  const upgradesCount = upgrades?.length || 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          onClick={handleExport}
          disabled={disabled || upgradesCount === 0}
        >
          <Upload className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Exportar ({upgradesCount})</TooltipContent>
    </Tooltip>
  );
}
