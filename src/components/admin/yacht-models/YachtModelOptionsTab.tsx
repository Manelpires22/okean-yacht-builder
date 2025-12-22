import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Pencil, Package, AlertTriangle, Search } from "lucide-react";
import { AIEnrichmentButton, EnrichmentData } from "@/components/admin/AIEnrichmentButton";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExportOptionsButton } from "./ExportOptionsButton";
import { ImportOptionsDialog } from "./ImportOptionsDialog";
import { ConfigurableSubItemsEditor, parseSubItems } from "@/components/admin/ConfigurableSubItemsEditor";
import { useManageYachtOptions } from "@/hooks/admin/useManageYachtOptions";

interface YachtModelOptionsTabProps {
  yachtModelId: string;
}

export function YachtModelOptionsTab({ yachtModelId }: YachtModelOptionsTabProps) {
  const {
    options,
    filteredOptions,
    optionsByCategory,
    activeCountByCategory,
    defaultOpenCategory,
    categories,
    jobStops,
    yachtModel,
    isLoading,
    dialogState,
    openCreateDialog,
    openEditDialog,
    closeDialog,
    setDeletingOptionId,
    setShowDeleteAllDialog,
    filters,
    form,
    onSubmit,
    mutations,
    handleDeleteConfirm,
    handleDeleteAllConfirm,
    formatCurrency,
  } = useManageYachtOptions(yachtModelId);

  const { register, setValue, watch, formState: { errors } } = form;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Opcionais do Modelo</h2>
            <p className="text-sm text-muted-foreground">
              Opcionais exclusivos deste modelo de iate.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar opcionais..."
                value={filters.searchTerm}
                onChange={(e) => filters.setSearchTerm(e.target.value)}
                className="pl-9 w-48"
              />
            </div>
            {filters.searchTerm.length > 0 && filters.searchTerm.length < 3 && (
              <span className="text-xs text-muted-foreground">
                Digite ao menos 3 caracteres
              </span>
            )}
            <div className="flex items-center gap-2 mr-2">
              <Switch
                id="show-inactive"
                checked={filters.showInactive}
                onCheckedChange={filters.setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm cursor-pointer">
                Mostrar inativos
              </Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  size="icon"
                  onClick={() => setShowDeleteAllDialog(true)}
                  disabled={!options?.length}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Apagar Opcionais ({options?.length || 0})</TooltipContent>
            </Tooltip>
            <ExportOptionsButton 
              options={options || []} 
              modelCode={yachtModel?.code || 'modelo'} 
              disabled={isLoading}
            />
            <ImportOptionsDialog 
              yachtModelId={yachtModelId} 
              categories={categories || []} 
            />
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Novo Opcional
            </Button>
          </div>
        </div>

        {filteredOptions.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {filters.showInactive ? "Nenhum opcional cadastrado" : "Nenhum opcional ativo"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filters.showInactive 
                ? "Este modelo ainda não possui opcionais. Clique no botão acima para criar o primeiro opcional."
                : "Este modelo não possui opcionais ativos. Ative o toggle 'Mostrar inativos' para ver todos os opcionais."}
            </p>
          </div>
        ) : (
          <Accordion type="single" collapsible defaultValue={defaultOpenCategory} className="w-full">
            {categories
              ?.filter(cat => (optionsByCategory[cat.id] || []).length > 0)
              .map(cat => {
              const categoryOptions = optionsByCategory[cat.id] || [];
              const optionCount = categoryOptions.length;
              const activeCount = activeCountByCategory[cat.id] || 0;

              return (
                <AccordionItem key={cat.id} value={cat.id}>
                  <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <span>{cat.label}</span>
                      <Badge variant="outline" className="ml-auto mr-2">
                        {filters.showInactive 
                          ? `${activeCount} ativos / ${optionCount} total`
                          : `${optionCount} ${optionCount === 1 ? 'opcional' : 'opcionais'}`}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    {categoryOptions.length > 0 ? (
                      <div className="border rounded-lg">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-14">Imagem</TableHead>
                              <TableHead>Código</TableHead>
                              <TableHead>Nome</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
                              <TableHead className="text-right">Prazo (dias)</TableHead>
                              <TableHead>Job Stop</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {categoryOptions.map((option) => (
                              <TableRow key={option.id}>
                                <TableCell>
                                  {option.image_url ? (
                                    <img 
                                      src={option.image_url} 
                                      alt={option.name}
                                      className="w-10 h-10 rounded object-cover"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded bg-muted flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </TableCell>
                                <TableCell className="font-mono text-sm">{option.code}</TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{option.name}</p>
                                    {option.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-1">
                                        {option.description}
                                      </p>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{formatCurrency(option.base_price)}</TableCell>
                                <TableCell className="text-right">
                                  {option.delivery_days_impact > 0 ? `+${option.delivery_days_impact}` : '0'}
                                </TableCell>
                                <TableCell>
                                  {option.job_stop ? (
                                    <Badge variant="outline" className="font-mono">
                                      {option.job_stop.stage}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant={option.is_active ? "default" : "destructive"}
                                    className={!option.is_active ? "opacity-70" : ""}
                                  >
                                    {option.is_active ? "Ativo" : "Inativo"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openEditDialog(option)}
                                    >
                                      <Pencil className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setDeletingOptionId(option.id)}
                                    >
                                      <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                          Nenhum opcional nesta categoria
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Adicione opcionais à categoria {cat.label}
                        </p>
                        <Button onClick={openCreateDialog}>
                          <Plus className="mr-2 h-4 w-4" />
                          Adicionar Primeiro Opcional
                        </Button>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogState.isDialogOpen} onOpenChange={(open) => {
        if (!open) closeDialog();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogState.editingOption ? "Editar Opcional" : "Criar Novo Opcional"}
            </DialogTitle>
            <DialogDescription>
              Este opcional será exclusivo deste modelo de iate.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Código *</Label>
                <Input
                  id="code"
                  {...register("code")}
                  placeholder="Ex: ELET-TV-43"
                />
                {errors.code && (
                  <p className="text-sm text-destructive">{errors.code.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="category_id">Categoria *</Label>
                <Select
                  value={watch("category_id")}
                  onValueChange={(value) => setValue("category_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category_id && (
                  <p className="text-sm text-destructive">{errors.category_id.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register("name")}
                placeholder='Ex: TV 43" no salão com lift elétrico'
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description">Descrição</Label>
                <AIEnrichmentButton
                  itemName={watch("name")}
                  itemType="optional"
                  currentBrand={watch("brand")}
                  currentModel={watch("model")}
                  onAccept={(data: EnrichmentData) => {
                    if (data.description) setValue("description", data.description);
                    if (data.brand) setValue("brand", data.brand);
                    if (data.model) setValue("model", data.model);
                    if (data.image_url) setValue("image_url", data.image_url);
                  }}
                />
              </div>
              <Textarea
                id="description"
                {...register("description")}
                placeholder="Descrição detalhada do opcional"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="brand">Marca</Label>
                <Input
                  id="brand"
                  {...register("brand")}
                  placeholder="Ex: CMC Marine"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Modelo</Label>
                <Input
                  id="model"
                  {...register("model")}
                  placeholder="Ex: MC² X19"
                />
              </div>
            </div>

            <ImageUploadField
              value={watch("image_url")}
              onChange={(url) => setValue("image_url", url || "")}
              productName={watch("name")}
              brand={watch("brand")}
              model={watch("model")}
              folder="options"
              label="Imagem do Opcional"
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Preço Base (R$) *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  {...register("base_price", { valueAsNumber: true })}
                />
                {errors.base_price && (
                  <p className="text-sm text-destructive">{errors.base_price.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="delivery_days_impact">Impacto no Prazo (dias)</Label>
                <Input
                  id="delivery_days_impact"
                  type="number"
                  {...register("delivery_days_impact", { valueAsNumber: true })}
                />
              </div>
            </div>

            {/* Switches - Customizável, Configurável, Ativo */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Item Customizável</Label>
                  <p className="text-sm text-muted-foreground">
                    Cliente pode solicitar customização deste item
                  </p>
                </div>
                <Switch
                  checked={watch("is_customizable")}
                  onCheckedChange={(checked) => setValue("is_customizable", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Item Configurável</Label>
                  <p className="text-sm text-muted-foreground">
                    Item precisa ser configurado durante a construção (ex: tecidos, acabamentos)
                  </p>
                </div>
                <Switch
                  checked={watch("is_configurable")}
                  onCheckedChange={(checked) => setValue("is_configurable", checked)}
                />
              </div>

              {/* Campos condicionais quando is_configurable está ativo */}
              {watch("is_configurable") && (
                <>
                  <div className="space-y-2 rounded-lg border p-4 bg-muted/50">
                    <Label>Job-Stop de Definição</Label>
                    <Select
                      value={watch("job_stop_id") || ""}
                      onValueChange={(val) => setValue("job_stop_id", val || null)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o Job-Stop" />
                      </SelectTrigger>
                      <SelectContent>
                        {jobStops?.map((js) => (
                          <SelectItem key={js.id} value={js.id}>
                            {js.stage} - {js.days_limit} dias - {js.item_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Prazo limite para definição desta configuração
                    </p>
                  </div>

                  <div className="rounded-lg border p-4 bg-muted/50">
                    <ConfigurableSubItemsEditor
                      value={parseSubItems(watch("configurable_sub_items"))}
                      onChange={(items) => setValue("configurable_sub_items", JSON.stringify(items))}
                    />
                  </div>
                </>
              )}

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Permite Múltiplos</Label>
                  <p className="text-sm text-muted-foreground">
                    Cliente pode selecionar quantidade maior que 1 (ex: 2 pares de luzes)
                  </p>
                </div>
                <Switch
                  checked={watch("allow_multiple")}
                  onCheckedChange={(checked) => setValue("allow_multiple", checked)}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Item Ativo</Label>
                  <p className="text-sm text-muted-foreground">
                    Exibir item na lista de opcionais disponíveis
                  </p>
                </div>
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(checked) => setValue("is_active", checked)}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={mutations.isSaving}>
                {mutations.isSaving && <span className="mr-2">⏳</span>}
                {dialogState.editingOption ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!dialogState.deletingOptionId} onOpenChange={(open) => !open && setDeletingOptionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este opcional? Esta ação não pode ser desfeita.
              O opcional será removido permanentemente deste modelo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Confirmation Dialog */}
      <AlertDialog open={dialogState.showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Apagar todos os Opcionais?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação irá remover <strong>{options?.length || 0} opcionais</strong> deste 
              modelo de iate. Esta ação <strong>não pode ser desfeita</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={mutations.isDeletingAll}
            >
              {mutations.isDeletingAll ? "Apagando..." : "Sim, Apagar Tudo"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
