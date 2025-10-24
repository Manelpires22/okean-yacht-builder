import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, AlertCircle, Trash2, Edit3, GitMerge } from "lucide-react";
import {
  useRenameCategory,
  useMergeCategories,
  useDeleteEmptyCategory,
} from "@/hooks/useMemorialCategoryManagement";

const renameSchema = z.object({
  newName: z
    .string()
    .min(1, "Nome não pode ser vazio")
    .max(100, "Nome muito longo (máx 100 caracteres)")
    .refine(
      (val) => val.trim().length > 0,
      "Nome não pode conter apenas espaços"
    ),
});

const mergeSchema = z.object({
  targetCategory: z.string().min(1, "Selecione a categoria de destino"),
});

type Action = "rename" | "merge" | "delete";

interface CategoryManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoria: string;
  modelo: string;
  itemCount: number;
  allCategories: string[];
}

export function CategoryManagementDialog({
  open,
  onOpenChange,
  categoria,
  modelo,
  itemCount,
  allCategories,
}: CategoryManagementDialogProps) {
  const [activeTab, setActiveTab] = useState<Action>("rename");

  const renameMutation = useRenameCategory();
  const mergeMutation = useMergeCategories();
  const deleteMutation = useDeleteEmptyCategory();

  const renameForm = useForm({
    resolver: zodResolver(renameSchema),
    defaultValues: { newName: categoria },
  });

  const mergeForm = useForm({
    resolver: zodResolver(mergeSchema),
    defaultValues: { targetCategory: "" },
  });

  const handleRename = async (data: z.infer<typeof renameSchema>) => {
    await renameMutation.mutateAsync({
      modelo,
      oldName: categoria,
      newName: data.newName.trim(),
    });
    onOpenChange(false);
    renameForm.reset();
  };

  const handleMerge = async (data: z.infer<typeof mergeSchema>) => {
    await mergeMutation.mutateAsync({
      modelo,
      sourceCategory: categoria,
      targetCategory: data.targetCategory,
    });
    onOpenChange(false);
    mergeForm.reset();
  };

  const handleDelete = async () => {
    if (itemCount > 0) {
      return;
    }

    await deleteMutation.mutateAsync({ modelo, categoria });
    onOpenChange(false);
  };

  const handleClose = () => {
    onOpenChange(false);
    renameForm.reset({ newName: categoria });
    mergeForm.reset();
  };

  const isSubmitting =
    renameMutation.isPending || mergeMutation.isPending || deleteMutation.isPending;

  const otherCategories = allCategories.filter((cat) => cat !== categoria);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar Categoria</DialogTitle>
          <DialogDescription>
            Categoria: <Badge variant="outline">{categoria}</Badge> ({itemCount}{" "}
            {itemCount === 1 ? "item" : "itens"})
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as Action)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rename">
              <Edit3 className="h-4 w-4 mr-2" />
              Renomear
            </TabsTrigger>
            <TabsTrigger value="merge">
              <GitMerge className="h-4 w-4 mr-2" />
              Mesclar
            </TabsTrigger>
            <TabsTrigger value="delete" disabled={itemCount > 0}>
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: RENOMEAR */}
          <TabsContent value="rename" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Todos os <strong>{itemCount} itens</strong> desta categoria serão
                atualizados com o novo nome.
              </AlertDescription>
            </Alert>

            <Form {...renameForm}>
              <form onSubmit={renameForm.handleSubmit(handleRename)} className="space-y-4">
                <FormField
                  control={renameForm.control}
                  name="newName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Novo Nome da Categoria</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Convés Principal"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormDescription>
                        Escolha um nome descritivo e único para o modelo.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Renomear Categoria
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* TAB 2: MESCLAR */}
          <TabsContent value="merge" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Os <strong>{itemCount} itens</strong> de{" "}
                <Badge variant="outline">{categoria}</Badge> serão movidos para a
                categoria de destino. A categoria atual será removida.
              </AlertDescription>
            </Alert>

            <Form {...mergeForm}>
              <form onSubmit={mergeForm.handleSubmit(handleMerge)} className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                  <Badge variant="secondary">{categoria}</Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Categoria de Destino
                  </span>
                </div>

                <FormField
                  control={mergeForm.control}
                  name="targetCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mesclar em (categoria destino)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {otherCategories.length === 0 ? (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              Nenhuma outra categoria disponível
                            </div>
                          ) : (
                            otherCategories.map((cat) => (
                              <SelectItem key={cat} value={cat}>
                                {cat}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Os itens manterão suas configurações, apenas a categoria será
                        alterada.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || otherCategories.length === 0}
                    variant="destructive"
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Mesclar Categorias
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* TAB 3: DELETAR */}
          <TabsContent value="delete" className="space-y-4">
            {itemCount > 0 ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Esta categoria possui <strong>{itemCount} itens</strong> e não pode
                  ser deletada. Use a aba <strong>"Mesclar"</strong> para mover os itens
                  para outra categoria primeiro.
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Esta ação é <strong>irreversível</strong>. A categoria será removida
                    permanentemente.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isSubmitting}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Deletar Categoria Vazia
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
