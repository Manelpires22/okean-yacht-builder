import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertTriangle } from "lucide-react";
import { MemorialCategory } from "@/types/memorial";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useMemorialCategoryStats } from "@/hooks/useMemorialCategoryStats";

interface MergeCategoriesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: MemorialCategory[];
}

export function MergeCategoriesDialog({
  open,
  onOpenChange,
  categories,
}: MergeCategoriesDialogProps) {
  const [sourceId, setSourceId] = useState<string>("");
  const [targetId, setTargetId] = useState<string>("");
  const [isMerging, setIsMerging] = useState(false);
  const queryClient = useQueryClient();
  const { data: stats = [] } = useMemorialCategoryStats();

  const sourceStats = stats.find(s => s.category_id === sourceId);
  const targetStats = stats.find(s => s.category_id === targetId);

  const handleMerge = async () => {
    if (!sourceId || !targetId) {
      toast.error("Selecione as categorias de origem e destino");
      return;
    }

    if (sourceId === targetId) {
      toast.error("As categorias de origem e destino devem ser diferentes");
      return;
    }

    setIsMerging(true);

    try {
      // 1. Atualizar todos os itens da categoria de origem para a de destino
      const { error: updateError } = await (supabase as any)
        .from('memorial_items')
        .update({ category_id: targetId })
        .eq('category_id', sourceId);

      if (updateError) throw updateError;

      // 2. Deletar a categoria de origem
      const { error: deleteError } = await (supabase as any)
        .from('memorial_categories')
        .delete()
        .eq('id', sourceId);

      if (deleteError) throw deleteError;

      toast.success(
        `${sourceStats?.item_count || 0} itens movidos. Categoria mesclada com sucesso!`
      );

      // Invalidar queries
      queryClient.invalidateQueries({ queryKey: ['memorial-categories'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-category-stats'] });
      queryClient.invalidateQueries({ queryKey: ['memorial-items'] });

      // Resetar e fechar
      setSourceId("");
      setTargetId("");
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Erro ao mesclar categorias: " + error.message);
    } finally {
      setIsMerging(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Mesclar Categorias</DialogTitle>
          <DialogDescription>
            Todos os itens da categoria de origem serão movidos para a categoria de destino.
            A categoria de origem será deletada após a mesclagem.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label>Categoria de Origem (será deletada) *</Label>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria origem" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(c => c.id !== targetId)
                  .map((cat) => {
                    const catStats = stats.find(s => s.category_id === cat.id);
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label} ({catStats?.item_count || 0} itens)
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {sourceStats && (
              <div className="flex gap-2 items-center text-sm text-muted-foreground">
                <Badge variant="secondary">{sourceStats.item_count} itens</Badge>
                {sourceStats.model_names.length > 0 && (
                  <span>em {sourceStats.model_names.join(", ")}</span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Categoria de Destino (receberá os itens) *</Label>
            <Select value={targetId} onValueChange={setTargetId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria destino" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter(c => c.id !== sourceId)
                  .map((cat) => {
                    const catStats = stats.find(s => s.category_id === cat.id);
                    return (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label} ({catStats?.item_count || 0} itens)
                      </SelectItem>
                    );
                  })}
              </SelectContent>
            </Select>
            {targetStats && (
              <div className="flex gap-2 items-center text-sm text-muted-foreground">
                <Badge variant="secondary">{targetStats.item_count} itens</Badge>
                {targetStats.model_names.length > 0 && (
                  <span>em {targetStats.model_names.join(", ")}</span>
                )}
              </div>
            )}
          </div>

          {sourceId && targetId && sourceId !== targetId && (
            <div className="bg-warning/10 border border-warning rounded-lg p-4 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-medium text-warning">Atenção: Esta ação é irreversível!</p>
                <p className="text-muted-foreground">
                  {sourceStats?.item_count || 0} itens serão movidos de "{categories.find(c => c.id === sourceId)?.label}" 
                  para "{categories.find(c => c.id === targetId)?.label}".
                </p>
                <p className="text-muted-foreground">
                  A categoria de origem será deletada permanentemente.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isMerging}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleMerge}
            disabled={isMerging || !sourceId || !targetId || sourceId === targetId}
            variant="default"
          >
            {isMerging && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Mesclar Categorias
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
