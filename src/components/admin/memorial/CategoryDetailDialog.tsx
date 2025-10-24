import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface CategoryDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: string;
  totalItems: number;
  models: Array<{ modelo: string; itemCount: number }>;
}

export function CategoryDetailDialog({
  open,
  onOpenChange,
  categoria,
  totalItems,
  models,
}: CategoryDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Categoria</DialogTitle>
          <DialogDescription>
            Categoria: <Badge variant="outline" className="font-semibold">{categoria}</Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Estatísticas Gerais */}
          <Card className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total de Itens</p>
                <p className="text-2xl font-bold text-foreground">{totalItems}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Modelos</p>
                <p className="text-2xl font-bold text-foreground">{models.length}</p>
              </div>
            </div>
          </Card>

          <Separator />

          {/* Detalhes por Modelo */}
          <div>
            <h3 className="text-sm font-medium mb-3 text-muted-foreground">
              Itens por Modelo
            </h3>
            <div className="space-y-2">
              {models
                .sort((a, b) => b.itemCount - a.itemCount)
                .map((model) => (
                  <div
                    key={model.modelo}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{model.modelo}</Badge>
                    </div>
                    <div className="text-sm font-medium text-foreground">
                      {model.itemCount} {model.itemCount === 1 ? 'item' : 'itens'}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Informação */}
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              💡 <strong>Categorias são globais:</strong> Esta categoria pode ser usada
              por múltiplos modelos. Os itens específicos dentro da categoria variam
              conforme o modelo.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
