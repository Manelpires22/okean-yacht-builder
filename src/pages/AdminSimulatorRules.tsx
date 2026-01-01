import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Pencil, Trash2 } from "lucide-react";
import {
  useSimulatorBusinessRules,
  useUpdateBusinessRule,
  useCreateBusinessRule,
  useDeleteBusinessRule,
  SimulatorBusinessRule,
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

export default function AdminSimulatorRules() {
  const { data: rules, isLoading } = useSimulatorBusinessRules();
  const updateRule = useUpdateBusinessRule();
  const createRule = useCreateBusinessRule();
  const deleteRule = useDeleteBusinessRule();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<Partial<SimulatorBusinessRule> | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleOpenCreate = () => {
    setEditingRule({
      rule_key: "",
      rule_value: 0,
      description: "",
      category: "general",
    });
    setIsCreating(true);
    setDialogOpen(true);
  };

  const handleOpenEdit = (rule: SimulatorBusinessRule) => {
    setEditingRule({ ...rule });
    setIsCreating(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingRule?.rule_key) return;

    if (isCreating) {
      await createRule.mutateAsync({
        rule_key: editingRule.rule_key,
        rule_value: editingRule.rule_value || 0,
        description: editingRule.description,
        category: editingRule.category,
      });
    } else {
      await updateRule.mutateAsync({
        rule_key: editingRule.rule_key,
        rule_value: editingRule.rule_value || 0,
        description: editingRule.description,
      });
    }

    setDialogOpen(false);
    setEditingRule(null);
    setIsCreating(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await deleteRule.mutateAsync(deleteId);
    setDeleteId(null);
  };

  const getCategoryBadge = (category: string | null) => {
    switch (category) {
      case "taxes":
        return <Badge variant="destructive">Taxas</Badge>;
      case "commissions":
        return <Badge variant="default">Comissões</Badge>;
      case "costs":
        return <Badge variant="secondary">Custos</Badge>;
      default:
        return <Badge variant="outline">Geral</Badge>;
    }
  };

  const formatRuleKey = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
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

  // Agrupar regras por categoria
  const rulesByCategory = rules?.reduce(
    (acc, rule) => {
      const cat = rule.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(rule);
      return acc;
    },
    {} as Record<string, SimulatorBusinessRule[]>
  );

  const categoryLabels: Record<string, string> = {
    taxes: "Taxas e Impostos",
    commissions: "Comissões",
    costs: "Custos",
    general: "Geral",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Settings className="h-8 w-8" />
              Regras de Negócio
            </h1>
            <p className="text-muted-foreground">
              Configure percentuais e valores padrão do simulador
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Regra
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {isCreating ? "Nova Regra" : "Editar Regra"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Chave (identificador único)</Label>
                  <Input
                    value={editingRule?.rule_key || ""}
                    onChange={(e) =>
                      setEditingRule((prev) => ({
                        ...prev,
                        rule_key: e.target.value.toLowerCase().replace(/\s/g, "_"),
                      }))
                    }
                    placeholder="Ex: warranty_percent"
                    disabled={!isCreating}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Valor</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editingRule?.rule_value || 0}
                    onChange={(e) =>
                      setEditingRule((prev) => ({
                        ...prev,
                        rule_value: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input
                    value={editingRule?.description || ""}
                    onChange={(e) =>
                      setEditingRule((prev) => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Ex: Percentual de garantia"
                  />
                </div>

                {isCreating && (
                  <div className="space-y-2">
                    <Label>Categoria</Label>
                    <Input
                      value={editingRule?.category || "general"}
                      onChange={(e) =>
                        setEditingRule((prev) => ({ ...prev, category: e.target.value }))
                      }
                      placeholder="Ex: taxes, commissions, costs"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={updateRule.isPending || createRule.isPending}
                  >
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {Object.entries(rulesByCategory || {}).map(([category, categoryRules]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{categoryLabels[category] || category}</CardTitle>
              <CardDescription>
                {categoryRules.length} regra{categoryRules.length !== 1 ? "s" : ""} configurada
                {categoryRules.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Regra</TableHead>
                    <TableHead>Chave</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryRules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">
                        {formatRuleKey(rule.rule_key)}
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-1 py-0.5 rounded">
                          {rule.rule_key}
                        </code>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {rule.rule_key.includes("percent") ? `${rule.rule_value}%` : rule.rule_value}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {rule.description || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(rule)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(rule.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {!rules?.length && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Nenhuma regra cadastrada. Clique em "Nova Regra" para começar.
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover regra?</AlertDialogTitle>
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
