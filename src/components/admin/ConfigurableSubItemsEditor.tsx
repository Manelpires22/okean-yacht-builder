import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

export interface SubItem {
  name: string;
  type: 'text' | 'color' | 'select' | 'number';
  options?: string[];
}

interface ConfigurableSubItemsEditorProps {
  value: SubItem[];
  onChange: (items: SubItem[]) => void;
}

const SUB_ITEM_TYPES = [
  { value: 'text', label: 'Texto' },
  { value: 'color', label: 'Cor' },
  { value: 'select', label: 'Seleção' },
  { value: 'number', label: 'Número' },
] as const;

export function parseSubItems(jsonString: string | null | undefined): SubItem[] {
  if (!jsonString) return [];
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed.map(item => ({
        name: item.name || '',
        type: item.type || 'text',
        options: item.options,
      }));
    }
    return [];
  } catch {
    return [];
  }
}

export function ConfigurableSubItemsEditor({ value, onChange }: ConfigurableSubItemsEditorProps) {
  const handleAddItem = () => {
    onChange([...value, { name: '', type: 'text' }]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof SubItem, newValue: string | string[]) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  return (
    <div className="space-y-3">
      <Label>Sub-itens Configuráveis</Label>
      
      {value.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          Nenhum sub-item configurado. Clique no botão abaixo para adicionar.
        </p>
      ) : (
        <div className="space-y-2">
          {value.map((item, index) => (
            <div 
              key={index} 
              className="flex items-center gap-2 p-3 border rounded-lg bg-muted/30"
            >
              <div className="flex-1 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome</Label>
                  <Input
                    value={item.name}
                    onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
                    placeholder="Ex: Cor, Tecido..."
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tipo</Label>
                  <Select
                    value={item.type}
                    onValueChange={(val) => handleUpdateItem(index, 'type', val)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUB_ITEM_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                onClick={() => handleRemoveItem(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddItem}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Sub-item
      </Button>
      
      <p className="text-xs text-muted-foreground">
        Sub-itens são campos que precisam ser definidos durante a configuração (ex: cor, material, acabamento).
      </p>
    </div>
  );
}
