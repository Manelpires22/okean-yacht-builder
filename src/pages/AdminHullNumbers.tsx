import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useHullNumbers, useDeleteHullNumber, useResetUncontractedHullNumbers, HullNumber } from "@/hooks/useHullNumbers";
import { ImportHullNumbersDialog } from "@/components/admin/hull-numbers/ImportHullNumbersDialog";
import { ImportMasterPlanDialog } from "@/components/admin/hull-numbers/ImportMasterPlanDialog";
import { CreateHullNumberDialog } from "@/components/admin/hull-numbers/CreateHullNumberDialog";
import { EditHullNumberDialog } from "@/components/admin/hull-numbers/EditHullNumberDialog";
import { ExportHullNumbersButton } from "@/components/admin/hull-numbers/ExportHullNumbersButton";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Anchor, FileSpreadsheet, Pencil, Plus, Trash2, ClipboardList, RefreshCw } from "lucide-react";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservada",
  contracted: "Contratada",
  delivered: "Entregue",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  reserved: "secondary",
  contracted: "outline",
  delivered: "secondary",
};

// Compact date cell component
const DateCell = ({ date }: { date: string | null }) => (
  <TableCell className="text-center text-xs px-2">
    {date ? (
      <span className="text-primary font-medium">
        {format(new Date(date), "dd/MM", { locale: ptBR })}
      </span>
    ) : (
      <span className="text-muted-foreground">—</span>
    )}
  </TableCell>
);

export default function AdminHullNumbers() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [masterPlanDialogOpen, setMasterPlanDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingHullNumber, setEditingHullNumber] = useState<HullNumber | null>(null);
  const { data: hullNumbers, isLoading } = useHullNumbers();
  const deleteHullNumber = useDeleteHullNumber();
  const resetMutation = useResetUncontractedHullNumbers();
  
  // Contagens para o botão de reset
  const uncontractedCount = hullNumbers?.filter(h => !h.contract_id).length || 0;
  const contractedCount = hullNumbers?.filter(h => h.contract_id).length || 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Anchor className="h-8 w-8" />
              Matrículas
            </h1>
            <p className="text-muted-foreground">
              Gerencie as matrículas e acompanhe o progresso de produção
            </p>
          </div>
          <div className="flex gap-2">
            {/* Reset Seguro */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="text-destructive hover:text-destructive" disabled={uncontractedCount === 0}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset ({uncontractedCount})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar Matrículas Não Contratadas</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação irá deletar <strong>{uncontractedCount}</strong> matrículas sem contrato vinculado.
                    <br /><br />
                    <strong>{contractedCount}</strong> matrículas contratadas serão preservadas para manter a integridade dos contratos.
                    <br /><br />
                    Isso é útil para limpar a tabela antes de reimportar o Plano Mestre.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => resetMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {resetMutation.isPending ? "Limpando..." : `Deletar ${uncontractedCount} Matrículas`}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <ExportHullNumbersButton hullNumbers={hullNumbers || []} disabled={isLoading} />
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar Simples
            </Button>
            <Button variant="outline" onClick={() => setMasterPlanDialogOpen(true)}>
              <ClipboardList className="h-4 w-4 mr-2" />
              Importar Plano Mestre
            </Button>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Matrícula
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Matrículas</CardTitle>
            <CardDescription>
              {hullNumbers?.length || 0} matrículas cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !hullNumbers || hullNumbers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Anchor className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Nenhuma matrícula cadastrada</p>
                <p className="text-sm">Importe uma planilha ou adicione manualmente.</p>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-6">
                <Table>
                  <TableHeader>
                    {/* Category Headers Row */}
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead colSpan={3} className="text-center font-medium text-xs uppercase tracking-wider text-muted-foreground">
                        Identificação
                      </TableHead>
                      <TableHead colSpan={4} className="text-center font-medium text-xs uppercase tracking-wider text-muted-foreground border-l border-border">
                        Job Stops
                      </TableHead>
                      <TableHead colSpan={4} className="text-center font-medium text-xs uppercase tracking-wider text-muted-foreground border-l border-border">
                        Produção
                      </TableHead>
                      <TableHead colSpan={3} className="text-center font-medium text-xs uppercase tracking-wider text-muted-foreground border-l border-border">
                        Testes & Entrega
                      </TableHead>
                      <TableHead colSpan={2} className="text-center font-medium text-xs uppercase tracking-wider text-muted-foreground border-l border-border">
                        
                      </TableHead>
                    </TableRow>
                    {/* Column Headers Row */}
                    <TableRow>
                      {/* Identification */}
                      <TableHead className="whitespace-nowrap">Marca</TableHead>
                      <TableHead className="whitespace-nowrap">Modelo</TableHead>
                      <TableHead className="whitespace-nowrap">Matrícula</TableHead>
                      
                      {/* Job Stops */}
                      <TableHead className="text-center text-xs px-2 border-l border-border">JS1</TableHead>
                      <TableHead className="text-center text-xs px-2">JS2</TableHead>
                      <TableHead className="text-center text-xs px-2">JS3</TableHead>
                      <TableHead className="text-center text-xs px-2">JS4</TableHead>
                      
                      {/* Production */}
                      <TableHead className="text-center text-xs px-2 border-l border-border">Entrada</TableHead>
                      <TableHead className="text-center text-xs px-2">Aberto</TableHead>
                      <TableHead className="text-center text-xs px-2">Convés</TableHead>
                      <TableHead className="text-center text-xs px-2">Fechado</TableHead>
                      
                      {/* Tests & Delivery */}
                      <TableHead className="text-center text-xs px-2 border-l border-border">Piscina</TableHead>
                      <TableHead className="text-center text-xs px-2">Mar</TableHead>
                      <TableHead className="text-center text-xs px-2">Entrega</TableHead>
                      
                      {/* Status & Actions */}
                      <TableHead className="border-l border-border">Status</TableHead>
                      <TableHead className="w-[80px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hullNumbers.map((hull) => (
                      <TableRow key={hull.id}>
                        {/* Identification */}
                        <TableCell className="font-medium whitespace-nowrap">{hull.brand}</TableCell>
                        <TableCell className="whitespace-nowrap">{hull.yacht_model?.name || '-'}</TableCell>
                        <TableCell className="font-mono font-bold">{hull.hull_number}</TableCell>
                        
                        {/* Job Stops */}
                        <DateCell date={hull.job_stop_1_date} />
                        <DateCell date={hull.job_stop_2_date} />
                        <DateCell date={hull.job_stop_3_date} />
                        <DateCell date={hull.job_stop_4_date} />
                        
                        {/* Production */}
                        <DateCell date={hull.hull_entry_date} />
                        <DateCell date={hull.barco_aberto_date} />
                        <DateCell date={hull.fechamento_convesdeck_date} />
                        <DateCell date={hull.barco_fechado_date} />
                        
                        {/* Tests & Delivery */}
                        <DateCell date={hull.teste_piscina_date} />
                        <DateCell date={hull.teste_mar_date} />
                        <DateCell date={hull.entrega_comercial_date || hull.estimated_delivery_date} />
                        
                        {/* Status & Actions */}
                        <TableCell className="border-l border-border">
                          <Badge variant={statusVariants[hull.status]}>
                            {statusLabels[hull.status]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingHullNumber(hull)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  disabled={hull.status !== 'available' || deleteHullNumber.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja excluir a matrícula {hull.brand} {hull.hull_number}?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteHullNumber.mutate(hull.id)}
                                  >
                                    Excluir
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportHullNumbersDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <ImportMasterPlanDialog
        open={masterPlanDialogOpen}
        onOpenChange={setMasterPlanDialogOpen}
      />

      <CreateHullNumberDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditHullNumberDialog
        hullNumber={editingHullNumber}
        open={!!editingHullNumber}
        onOpenChange={(open) => !open && setEditingHullNumber(null)}
      />
    </AdminLayout>
  );
}
