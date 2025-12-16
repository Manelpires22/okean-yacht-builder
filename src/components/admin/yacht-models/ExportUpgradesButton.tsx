import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { 
  exportToExcel, 
  transformUpgradesForExport, 
  generateFilename 
} from "@/lib/export-utils";

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
    <Button 
      variant="outline" 
      onClick={handleExport}
      disabled={disabled || upgradesCount === 0}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar ({upgradesCount})
    </Button>
  );
}
