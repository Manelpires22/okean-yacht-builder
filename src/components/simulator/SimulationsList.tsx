import { useState, useMemo } from "react";
import { useSimulations, useDeleteSimulation } from "@/hooks/useSimulations";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Eye, Trash2, Calculator, Copy, Pencil, Search, X } from "lucide-react";
import type { Simulation } from "@/hooks/useSimulations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SimulationDetailDialog } from "./SimulationDetailDialog";
import { useUserRole } from "@/hooks/useUserRole";
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
import { AppHeader } from "@/components/AppHeader";

interface SimulationsListProps {
  onNewSimulation: () => void;
  onDuplicateSimulation: (simulation: Simulation) => void;
  onEditSimulation: (simulation: Simulation) => void;
}

export function SimulationsList({ onNewSimulation, onDuplicateSimulation, onEditSimulation }: SimulationsListProps) {
  const { data: simulations, isLoading } = useSimulations();
  const { mutate: deleteSimulation, isPending: isDeleting } = useDeleteSimulation();
  const { data: roleData } = useUserRole();
  const isAdmin = roleData?.isAdmin ?? false;
  const [selectedSimulationId, setSelectedSimulationId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [simulationToDelete, setSimulationToDelete] = useState<string | null>(null);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [sellerFilter, setSellerFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");

  const selectedSimulation = simulations?.find(s => s.id === selectedSimulationId);

  // Valores únicos para dropdowns
  const uniqueSellers = useMemo(() => {
    if (!simulations) return [];
    const sellers = [...new Set(simulations.map(s => s.commission_name))];
    return sellers.filter(Boolean).sort();
  }, [simulations]);

  const uniqueModels = useMemo(() => {
    if (!simulations) return [];
    const models = [...new Set(simulations.map(s => s.yacht_model_code))];
    return models.filter(Boolean).sort();
  }, [simulations]);

  // Filtragem
  const filteredSimulations = useMemo(() => {
    if (!simulations) return [];
    
    return simulations.filter(sim => {
      const search = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        sim.simulation_number.toLowerCase().includes(search) ||
        sim.client_name.toLowerCase().includes(search) ||
        sim.yacht_model_code.toLowerCase().includes(search) ||
        sim.commission_name.toLowerCase().includes(search);
      
      const matchesSeller = sellerFilter === "all" || sim.commission_name === sellerFilter;
      const matchesModel = modelFilter === "all" || sim.yacht_model_code === modelFilter;
      
      return matchesSearch && matchesSeller && matchesModel;
    });
  }, [simulations, searchTerm, sellerFilter, modelFilter]);

  const hasActiveFilters = searchTerm || sellerFilter !== "all" || modelFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setSellerFilter("all");
    setModelFilter("all");
  };

  const getMarginBadgeVariant = (marginPercent: number) => {
    if (marginPercent >= 25) return "default";
    if (marginPercent >= 15) return "secondary";
    return "destructive";
  };

  const handleDelete = (id: string) => {
    setSimulationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (simulationToDelete) {
      deleteSimulation(simulationToDelete);
      setDeleteDialogOpen(false);
      setSimulationToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Simulações de Viabilidade" />
      
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Gerencie suas simulações de margem de contribuição
            </p>
            <Button onClick={onNewSimulation} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Nova Simulação
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Simulações Salvas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros */}
              {simulations && simulations.length > 0 && (
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por número, cliente, modelo ou vendedor..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={sellerFilter} onValueChange={setSellerFilter}>
                    <SelectTrigger className="w-full md:w-[200px]">
                      <SelectValue placeholder="Todos vendedores" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos vendedores</SelectItem>
                      {uniqueSellers.map(seller => (
                        <SelectItem key={seller} value={seller}>{seller}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={modelFilter} onValueChange={setModelFilter}>
                    <SelectTrigger className="w-full md:w-[150px]">
                      <SelectValue placeholder="Todos modelos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos modelos</SelectItem>
                      {uniqueModels.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {hasActiveFilters && (
                    <Button variant="ghost" size="icon" onClick={clearFilters} title="Limpar filtros">
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}

              {/* Contador de resultados */}
              {simulations && simulations.length > 0 && hasActiveFilters && (
                <p className="text-sm text-muted-foreground">
                  Exibindo {filteredSimulations.length} de {simulations.length} simulações
                </p>
              )}

              {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : !simulations?.length ? (
              <div className="text-center py-12">
                <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma simulação salva</h3>
                <p className="text-muted-foreground mb-4">
                  Crie sua primeira simulação para analisar a viabilidade comercial
                </p>
                <Button onClick={onNewSimulation}>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Simulação
                </Button>
              </div>
              ) : filteredSimulations.length === 0 && hasActiveFilters ? (
                <div className="text-center py-8">
                  <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">Nenhuma simulação encontrada com os filtros atuais</p>
                  <Button variant="link" onClick={clearFilters}>Limpar filtros</Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Modelo</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Margem</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSimulations.map((simulation) => (
                    <TableRow key={simulation.id}>
                      <TableCell className="font-mono text-sm">
                        {simulation.simulation_number}
                      </TableCell>
                      <TableCell>{simulation.client_name}</TableCell>
                      <TableCell>
                        <span className="font-medium">{simulation.yacht_model_code}</span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {simulation.commission_name}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={getMarginBadgeVariant(simulation.margem_percent)}>
                          {simulation.margem_percent.toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(simulation.created_at), "dd/MM/yy", { locale: ptBR })}
                      </TableCell>
                        <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedSimulationId(simulation.id)}
                            title="Ver detalhes"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEditSimulation(simulation)}
                            title="Editar simulação"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDuplicateSimulation(simulation)}
                            title="Duplicar simulação"
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {isAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(simulation.id)}
                              disabled={isDeleting}
                              title="Excluir"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedSimulation && (
        <SimulationDetailDialog
          simulation={selectedSimulation}
          open={!!selectedSimulationId}
          onOpenChange={(open) => !open && setSelectedSimulationId(null)}
          onDuplicate={(sim) => {
            setSelectedSimulationId(null);
            onDuplicateSimulation(sim);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Simulação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta simulação? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
