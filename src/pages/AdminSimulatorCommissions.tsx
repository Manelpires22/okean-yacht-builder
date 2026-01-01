import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Percent, Plus, Pencil, Trash2 } from "lucide-react";
import {
  useSimulatorCommissions,
  useCreateCommission,
  useUpdateCommission,
  useDeleteCommission,
  SimulatorCommission,
} from "@/hooks/useSimulatorConfig";
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

export default function AdminSimulatorCommissions() {
  const { data: commissions, isLoading } = useSimulatorCommissions();
  const createCommission = useCreateCommission();
  const updateCommission = useUpdateCommission();
  const deleteCommission = useDeleteCommission();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingCommission, setEditingCommission] = useState<Partial<SimulatorCommission> | null>(null);

  const handleOpenCreate = () => {
    setEditingCommission({
      name: "",
      type: "broker",
      percent_ferretti: 0,
      percent_okean: 0,
      is_active: true,
      display_order: (commissions?.length || 0) + 1,
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (commission: SimulatorCommission) => {
    setEditingCommission({ ...commission });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCommission?.name) return;

    if (editingCommission.id) {
      await updateCommission.mutateAsync({
        id: editingCommission.id,
        name: editingCommission.name,
        type: editingCommission.type,
        percent_ferretti: editingCommission.percent_ferretti,
        percent_okean: editingCommission.percent_okean,
        is_active: editingCommission.is_active,
        display_order: editingCommission.display_order,
      });
    } else {
      await createCommission.mutateAsync({
        name: editingCommission.name,
        type: editingCommission.type,
        percent_ferretti: editingCommission.percent_ferretti,
        percent_okean: editingCommission.percent_okean,
        is_active: editingCommission.is_active,
        display_order: editingCommission.display_order,
      });
    }

    setDialogOpen(false);
    setEditingCommission(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteCommission.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const handleToggleActive = async (commission: SimulatorCommission) => {
    await updateCommission.mutateAsync({
      id: commission.id,
      is_active: !commission.is_active,
    });
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "royalty":
        return <Badge variant="default">Royalty</Badge>;
      case "broker":
        return <Badge variant="secondary">Broker</Badge>;
      default:
        return <Badge variant="outline">Outro</Badge>;
    }
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

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Percent className="h-8 w-8" />
              Comissões
            </h1>
            <p className="text-muted-foreground">
              Configure royalties, comissões de broker e outras taxas
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Comissão
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCommission?.id ? "Editar Comissão" : "Nova Comissão"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input
                    value={editingCommission?.name || ""}
                    onChange={(e) =>
                      setEditingCommission((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Ex: Broker MarineX, Royalties"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={editingCommission?.type || "broker"}
                    onValueChange={(v) =>
                      setEditingCommission((prev) => ({
                        ...prev,
                        type: v as "broker" | "royalty" | "other",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="royalty">Royalty</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>% Ferretti</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingCommission?.percent_ferretti || 0}
                      onChange={(e) =>
                        setEditingCommission((prev) => ({
                          ...prev,
                          percent_ferretti: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>% OKEAN</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={editingCommission?.percent_okean || 0}
                      onChange={(e) =>
                        setEditingCommission((prev) => ({
                          ...prev,
                          percent_okean: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingCommission?.is_active ?? true}
                    onCheckedChange={(checked) =>
                      setEditingCommission((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                  <Label>Ativo</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={createCommission.isPending || updateCommission.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Comissões Cadastradas</CardTitle>
            <CardDescription>
              {commissions?.filter((c) => c.is_active).length || 0} ativas de{" "}
              {commissions?.length || 0} cadastradas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead className="text-right">% Ferretti</TableHead>
                  <TableHead className="text-right">% OKEAN</TableHead>
                  <TableHead className="text-center">Ativo</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions?.map((commission) => (
                  <TableRow key={commission.id} className={!commission.is_active ? "opacity-50" : ""}>
                    <TableCell className="font-medium">{commission.name}</TableCell>
                    <TableCell>{getTypeBadge(commission.type)}</TableCell>
                    <TableCell className="text-right">
                      {commission.percent_ferretti}%
                    </TableCell>
                    <TableCell className="text-right">
                      {commission.percent_okean}%
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={commission.is_active}
                        onCheckedChange={() => handleToggleActive(commission)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEdit(commission)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(commission.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!commissions?.length && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhuma comissão cadastrada. Clique em "Nova Comissão" para começar.
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
            <AlertDialogTitle>Remover comissão?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita.
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
