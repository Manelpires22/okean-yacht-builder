import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useHullNumbers, useDeleteHullNumber } from "@/hooks/useHullNumbers";
import { ImportHullNumbersDialog } from "@/components/admin/hull-numbers/ImportHullNumbersDialog";
import { CreateHullNumberDialog } from "@/components/admin/hull-numbers/CreateHullNumberDialog";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Anchor, FileSpreadsheet, Plus, Trash2 } from "lucide-react";

const statusLabels: Record<string, string> = {
  available: "Disponível",
  reserved: "Reservada",
  contracted: "Contratada",
};

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  available: "default",
  reserved: "secondary",
  contracted: "outline",
};

export default function AdminHullNumbers() {
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { data: hullNumbers, isLoading } = useHullNumbers();
  const deleteHullNumber = useDeleteHullNumber();

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
              Gerencie as matrículas disponíveis para configuração de iates
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Importar Planilha
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marca</TableHead>
                    <TableHead>Modelo</TableHead>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Entrada Casco</TableHead>
                    <TableHead>Entrega Prevista</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hullNumbers.map((hull) => (
                    <TableRow key={hull.id}>
                      <TableCell className="font-medium">{hull.brand}</TableCell>
                      <TableCell>{hull.yacht_model?.name || '-'}</TableCell>
                      <TableCell className="font-mono font-bold">{hull.hull_number}</TableCell>
                      <TableCell>
                        {format(new Date(hull.hull_entry_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(hull.estimated_delivery_date), "dd/MM/yyyy", { locale: ptBR })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariants[hull.status]}>
                          {statusLabels[hull.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ImportHullNumbersDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />

      <CreateHullNumberDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </AdminLayout>
  );
}
