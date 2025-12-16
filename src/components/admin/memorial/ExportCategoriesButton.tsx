import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel, transformCategoriesForExport } from "@/lib/export-utils";
import { format } from "date-fns";

interface ExportCategoriesButtonProps {
  categories: any[];
  disabled?: boolean;
}

export function ExportCategoriesButton({ categories, disabled }: ExportCategoriesButtonProps) {
  const handleExport = () => {
    if (!categories || categories.length === 0) {
      toast.error("Nenhuma categoria para exportar");
      return;
    }

    const exportData = transformCategoriesForExport(categories);
    const filename = `categorias_memorial_${format(new Date(), 'yyyy-MM-dd')}`;
    exportToExcel(exportData, filename, "Categorias");
    toast.success(`${categories.length} categorias exportadas com sucesso!`);
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={disabled || !categories?.length}
    >
      <Download className="mr-2 h-4 w-4" />
      Exportar
    </Button>
  );
}
