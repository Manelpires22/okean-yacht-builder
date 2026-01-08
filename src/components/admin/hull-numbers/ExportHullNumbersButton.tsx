import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { exportToExcel } from "@/lib/export-utils";
import { format } from "date-fns";
import { HullNumber } from "@/hooks/useHullNumbers";

interface ExportHullNumbersButtonProps {
  hullNumbers: HullNumber[];
  disabled?: boolean;
}

const statusLabels: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservada",
  contracted: "Contratada",
};

export function ExportHullNumbersButton({ hullNumbers, disabled }: ExportHullNumbersButtonProps) {
  const handleExport = () => {
    const exportData = hullNumbers.map(h => ({
      Marca: h.brand,
      Modelo: h.yacht_model?.name || '',
      Código: h.yacht_model?.code || '',
      Matrícula: h.hull_number,
      'Entrada Casco': format(new Date(h.hull_entry_date), "dd/MM/yyyy"),
      'Entrega Prevista': format(new Date(h.estimated_delivery_date), "dd/MM/yyyy"),
      Status: statusLabels[h.status] || h.status,
    }));

    exportToExcel(exportData, `matriculas_${format(new Date(), 'yyyy-MM-dd')}`, "Matrículas");
    toast.success(`${hullNumbers.length} matrículas exportadas!`);
  };

  return (
    <Button variant="outline" onClick={handleExport} disabled={disabled || !hullNumbers?.length}>
      <Download className="mr-2 h-4 w-4" />
      Exportar
    </Button>
  );
}
