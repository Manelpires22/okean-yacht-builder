import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Package } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";

interface YachtModelOptionsTabProps {
  yachtModelId: string;
}

export function YachtModelOptionsTab({ yachtModelId }: YachtModelOptionsTabProps) {
  const queryClient = useQueryClient();
  const [selectOpen, setSelectOpen] = useState(false);

  // Fetch opcionais vinculados a este modelo
  const { data: linkedOptions, isLoading: loadingLinked } = useQuery({
    queryKey: ['yacht-model-options', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('option_yacht_models')
        .select(`
          id,
          option:options(
            id,
            code,
            name,
            base_price,
            category:option_categories(name)
          )
        `)
        .eq('yacht_model_id', yachtModelId);
      if (error) throw error;
      return data;
    }
  });

  // Fetch TODOS os opcionais ativos
  const { data: allOptions, isLoading: loadingAll } = useQuery({
    queryKey: ['all-options'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('options')
        .select(`
          id,
          code,
          name,
          base_price,
          category:option_categories(name)
        `)
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  // Mutation: Vincular opcional
  const linkMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { error } = await supabase
        .from('option_yacht_models')
        .insert({ yacht_model_id: yachtModelId, option_id: optionId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      toast.success('Opcional vinculado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao vincular opcional: ' + error.message);
    }
  });

  // Mutation: Desvincular opcional
  const unlinkMutation = useMutation({
    mutationFn: async (relationId: string) => {
      const { error } = await supabase
        .from('option_yacht_models')
        .delete()
        .eq('id', relationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['yacht-model-options'] });
      toast.success('Opcional desvinculado com sucesso');
    },
    onError: (error: Error) => {
      toast.error('Erro ao desvincular opcional: ' + error.message);
    }
  });

  // Opcionais disponíveis para vincular (excluir já vinculados)
  const availableOptions = allOptions?.filter(
    opt => !linkedOptions?.some(linked => linked.option?.id === opt.id)
  ) || [];

  if (loadingLinked || loadingAll) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Opcionais Compatíveis</h2>
          <p className="text-sm text-muted-foreground">
            Gerir quais opcionais estão disponíveis para este modelo
          </p>
        </div>
        
        <Popover open={selectOpen} onOpenChange={setSelectOpen}>
          <PopoverTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Vincular Opcional
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0">
            <Command>
              <CommandInput placeholder="Buscar opcional..." />
              <CommandList>
                <CommandEmpty>Nenhum opcional encontrado</CommandEmpty>
                <CommandGroup>
                  {availableOptions.map((option) => (
                    <CommandItem
                      key={option.id}
                      onSelect={() => {
                        linkMutation.mutate(option.id);
                        setSelectOpen(false);
                      }}
                    >
                      <div className="flex flex-col gap-1 w-full">
                        <span className="font-medium">{option.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {option.code} • {option.category?.name || 'Sem categoria'} • €{option.base_price?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Card>
        {linkedOptions && linkedOptions.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Preço Base</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {linkedOptions.map((rel) => (
                <TableRow key={rel.id}>
                  <TableCell className="font-mono text-xs">{rel.option?.code}</TableCell>
                  <TableCell className="font-medium">{rel.option?.name}</TableCell>
                  <TableCell>{rel.option?.category?.name || '-'}</TableCell>
                  <TableCell>€{rel.option?.base_price?.toLocaleString() || '0'}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('Desvincular este opcional?')) {
                          unlinkMutation.mutate(rel.id);
                        }
                      }}
                      disabled={unlinkMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum opcional vinculado
            </h3>
            <p className="text-muted-foreground mb-4">
              Use o botão acima para vincular opcionais a este modelo
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}
