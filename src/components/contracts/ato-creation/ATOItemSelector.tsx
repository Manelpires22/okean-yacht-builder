import { Edit, Plus, FileText, Palette, ArrowUpCircle } from "lucide-react";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ATOItemSelectorProps {
  onSelectType: (type: "edit_existing" | "add_optional" | "new_customization" | "define_finishing" | "add_upgrade") => void;
}

export function ATOItemSelector({ onSelectType }: ATOItemSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onSelectType("edit_existing")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Edit className="h-5 w-5 text-primary" />
            Editar Item Existente
          </CardTitle>
          <CardDescription>
            Modificar opcionais ou itens do memorial que já estão no contrato base
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onSelectType("add_optional")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Plus className="h-5 w-5 text-primary" />
            Adicionar Opcional
          </CardTitle>
          <CardDescription>
            Incluir um novo opcional disponível para este modelo de iate
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onSelectType("add_upgrade")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ArrowUpCircle className="h-5 w-5 text-primary" />
            Adicionar Upgrade
          </CardTitle>
          <CardDescription>
            Incluir um upgrade disponível para itens do memorial
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onSelectType("new_customization")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5 text-primary" />
            Nova Customização
          </CardTitle>
          <CardDescription>
            Solicitar uma customização livre não prevista em catálogo
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="hover:border-primary transition-colors cursor-pointer" onClick={() => onSelectType("define_finishing")}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Palette className="h-5 w-5 text-primary" />
            Definir Decor/Acabamento
          </CardTitle>
          <CardDescription>
            Especificar itens marcados como "A Definir" no memorial descritivo
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}
