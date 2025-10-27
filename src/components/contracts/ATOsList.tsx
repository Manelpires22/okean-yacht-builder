import { useState } from "react";
import { useATOs } from "@/hooks/useATOs";
import { useATOConfigurations } from "@/hooks/useATOConfigurations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, DollarSign, Calendar, ChevronRight, Package } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { getATOStatusLabel, getATOStatusColor } from "@/lib/contract-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreateATODialog } from "./CreateATODialog";
import { ATODetailDialog } from "./ATODetailDialog";

function ATOConfigurationBadge({ atoId }: { atoId: string }) {
  const { data: configurations, isLoading } = useATOConfigurations(atoId);

  if (isLoading) {
    return <Badge variant="outline" className="animate-pulse">...</Badge>;
  }

  const count = configurations?.length || 0;

  if (count === 0) {
    return (
      <Badge variant="outline" className="text-orange-600 border-orange-300 dark:border-orange-700">
        <Package className="h-3 w-3 mr-1" />
        Sem itens
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
      <Package className="h-3 w-3 mr-1" />
      {count} {count === 1 ? "item" : "itens"}
    </Badge>
  );
}

interface ATOsListProps {
  contractId: string;
}

export function ATOsList({ contractId }: ATOsListProps) {
  const { data: atos, isLoading } = useATOs(contractId);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedATO, setSelectedATO] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>ATOs (Additional To Order)</CardTitle>
              <CardDescription>
                Aditivos ao contrato original - modificações e configurações
              </CardDescription>
            </div>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nova ATO
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!atos || atos.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ATO criada</h3>
              <p className="text-muted-foreground mb-4">
                ATOs são aditivos ao contrato para modificações ou configurações extras
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeira ATO
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Impacto Preço</TableHead>
                  <TableHead>Impacto Prazo</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {atos.map((ato) => (
                  <TableRow key={ato.id}>
                    <TableCell className="font-medium">
                      <Badge variant="outline">{ato.ato_number}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-semibold">{ato.title}</p>
                        {ato.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {ato.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <ATOConfigurationBadge atoId={ato.id} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            ato.price_impact > 0
                              ? "text-green-600 font-semibold"
                              : ato.price_impact < 0
                              ? "text-red-600 font-semibold"
                              : ""
                          }
                        >
                          {ato.price_impact > 0 ? "+" : ""}
                          {formatCurrency(ato.price_impact)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span
                          className={
                            ato.delivery_days_impact > 0
                              ? "text-orange-600 font-semibold"
                              : ""
                          }
                        >
                          {ato.delivery_days_impact > 0 ? "+" : ""}
                          {ato.delivery_days_impact} dias
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getATOStatusColor(ato.status)}>
                        {getATOStatusLabel(ato.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(ato.requested_at), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedATO(ato.id)}
                      >
                        Ver
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateATODialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        contractId={contractId}
      />

      <ATODetailDialog
        open={!!selectedATO}
        onOpenChange={(open) => !open && setSelectedATO(null)}
        atoId={selectedATO}
      />
    </div>
  );
}
