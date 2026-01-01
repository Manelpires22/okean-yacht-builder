import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Plus, Pencil, Trash2 } from "lucide-react";
import { useSimulatorModelCosts, useUpsertModelCost, useDeleteModelCost, SimulatorModelCost } from "@/hooks/useSimulatorConfig";
import { useYachtModels } from "@/hooks/useYachtModels";
import { formatCurrency } from "@/lib/formatters";
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

export default function AdminSimulatorCosts() {
  const { data: costs, isLoading } = useSimulatorModelCosts();
  const { data: yachtModels } = useYachtModels();
  const upsertCost = useUpsertModelCost();
  const deleteCost = useDeleteModelCost();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<Partial<SimulatorModelCost> | null>(null);

  // Modelos disponíveis (não cadastrados ainda)
  const usedModelIds = costs?.map((c) => c.yacht_model_id) || [];
  const availableModels = yachtModels?.filter((m) => !usedModelIds.includes(m.id)) || [];

  const handleOpenCreate = () => {
    setEditingCost({
      yacht_model_id: "",
      custo_mp_import: 0,
      custo_mp_nacional: 0,
      custo_mo_horas: 0,
      custo_mo_valor_hora: 55,
      projeto: "OKEAN",
      tax_import_percent: 21,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (cost: SimulatorModelCost) => {
    setEditingCost({ ...cost });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCost?.yacht_model_id) return;

    await upsertCost.mutateAsync({
      yacht_model_id: editingCost.yacht_model_id,
      custo_mp_import: editingCost.custo_mp_import || 0,
      custo_mp_nacional: editingCost.custo_mp_nacional || 0,
      custo_mo_horas: editingCost.custo_mo_horas || 0,
      custo_mo_valor_hora: editingCost.custo_mo_valor_hora || 55,
      projeto: editingCost.projeto || "OKEAN",
      tax_import_percent: editingCost.tax_import_percent || 21,
    });

    setDialogOpen(false);
    setEditingCost(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCost.mutateAsync(deleteId);
    setDeleteId(null);
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-96" />
        </div>
      </AdminLayout>
    );
  }

  const totalMO = (cost: SimulatorModelCost) =>
    cost.custo_mo_horas * cost.custo_mo_valor_hora;

  const totalCusto = (cost: SimulatorModelCost) =>
    cost.custo_mp_import + cost.custo_mp_nacional + totalMO(cost);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <DollarSign className="h-8 w-8" />
              Custos por Modelo
            </h1>
            <p className="text-muted-foreground">
              Configure os custos base de cada modelo de iate
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate} disabled={availableModels.length === 0}>
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Modelo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCost?.id ? "Editar Custos" : "Novo Modelo"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {!editingCost?.id && (
                  <div className="space-y-2">
                    <Label>Modelo de Iate</Label>
                    <Select
                      value={editingCost?.yacht_model_id || ""}
                      onValueChange={(v) =>
                        setEditingCost((prev) => ({ ...prev, yacht_model_id: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um modelo" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name} ({m.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Projeto</Label>
                  <Select
                    value={editingCost?.projeto || "OKEAN"}
                    onValueChange={(v) =>
                      setEditingCost((prev) => ({
                        ...prev,
                        projeto: v as "Ferretti" | "OKEAN",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OKEAN">OKEAN</SelectItem>
                      <SelectItem value="Ferretti">Ferretti</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>MP Importada (R$)</Label>
                    <Input
                      type="number"
                      value={editingCost?.custo_mp_import || 0}
                      onChange={(e) =>
                        setEditingCost((prev) => ({
                          ...prev,
                          custo_mp_import: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>MP Nacional (R$)</Label>
                    <Input
                      type="number"
                      value={editingCost?.custo_mp_nacional || 0}
                      onChange={(e) =>
                        setEditingCost((prev) => ({
                          ...prev,
                          custo_mp_nacional: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Horas MO</Label>
                    <Input
                      type="number"
                      value={editingCost?.custo_mo_horas || 0}
                      onChange={(e) =>
                        setEditingCost((prev) => ({
                          ...prev,
                          custo_mo_horas: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor/Hora (R$)</Label>
                    <Input
                      type="number"
                      value={editingCost?.custo_mo_valor_hora || 55}
                      onChange={(e) =>
                        setEditingCost((prev) => ({
                          ...prev,
                          custo_mo_valor_hora: parseFloat(e.target.value) || 55,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imposto Importação (%)</Label>
                  <Input
                    type="number"
                    value={editingCost?.tax_import_percent || 21}
                    onChange={(e) =>
                      setEditingCost((prev) => ({
                        ...prev,
                        tax_import_percent: parseFloat(e.target.value) || 21,
                      }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSave} disabled={upsertCost.isPending}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modelos Cadastrados</CardTitle>
            <CardDescription>
              {costs?.length || 0} modelos com custos configurados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Projeto</TableHead>
                  <TableHead className="text-right">MP Import</TableHead>
                  <TableHead className="text-right">MP Nacional</TableHead>
                  <TableHead className="text-right">MO (h × R$)</TableHead>
                  <TableHead className="text-right">Total Custo</TableHead>
                  <TableHead className="text-right">Tax Import</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costs?.map((cost) => (
                  <TableRow key={cost.id}>
                    <TableCell className="font-medium">
                      {cost.yacht_model?.name || "—"}
                      <span className="text-muted-foreground ml-2 text-xs">
                        {cost.yacht_model?.code}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cost.projeto === "Ferretti" ? "default" : "secondary"}>
                        {cost.projeto}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cost.custo_mp_import)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(cost.custo_mp_nacional)}
                    </TableCell>
                    <TableCell className="text-right">
                      {cost.custo_mo_horas}h × R$ {cost.custo_mo_valor_hora}
                      <br />
                      <span className="text-muted-foreground text-xs">
                        = {formatCurrency(totalMO(cost))}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {formatCurrency(totalCusto(cost))}
                    </TableCell>
                    <TableCell className="text-right">
                      {cost.tax_import_percent}%
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(cost)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(cost.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!costs?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhum modelo cadastrado. Clique em "Adicionar Modelo" para começar.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover custos do modelo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Os custos deste modelo serão removidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
