import { AdminLayout } from "@/components/AdminLayout";
import { useContracts } from "@/hooks/useContracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Calendar, DollarSign, Ship, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { getContractStatusLabel, getContractStatusColor } from "@/lib/contract-utils";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContractsDashboard } from "@/components/contracts/ContractsDashboard";

export default function Contracts() {
  const navigate = useNavigate();
  const { data: contracts, isLoading } = useContracts();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <div className="grid gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Contratos</h1>
            <p className="text-sm text-muted-foreground">
              Dashboard e gestão de contratos e aditivos (ATOs)
            </p>
          </div>
          <Badge variant="outline" className="text-sm sm:text-lg px-3 sm:px-4 py-1.5 sm:py-2">
            {contracts?.length || 0} contrato(s)
          </Badge>
        </div>

        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="list">Lista de Contratos</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <ContractsDashboard />
          </TabsContent>

          <TabsContent value="list" className="space-y-4 md:space-y-6">
            {!contracts || contracts.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12">
              <FileText className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-4" />
              <h3 className="text-base sm:text-lg font-semibold mb-2 text-center">Nenhum contrato encontrado</h3>
              <p className="text-xs sm:text-sm text-muted-foreground text-center max-w-md px-4">
                Contratos são criados automaticamente quando cotações são aceitas pelos clientes.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:gap-4">
            {contracts.map((contract) => (
              <Card
                key={contract.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(`/contracts/${contract.id}`)}
              >
                <CardHeader className="pb-3 md:pb-6">
                  <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                        <span className="truncate">{contract.contract_number}</span>
                      </CardTitle>
                      <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm">
                        <span className="flex items-center gap-1">
                          <Ship className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                          <span className="truncate">{contract.yacht_model?.name || "N/A"}</span>
                        </span>
                        {contract.client && (
                          <span className="truncate">• {contract.client.name}</span>
                        )}
                      </CardDescription>
                    </div>
                    <Badge
                      className={`${getContractStatusColor(contract.status)} text-xs whitespace-nowrap`}
                    >
                      {getContractStatusLabel(contract.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Valor Total</p>
                        <p className="font-semibold">
                          {formatCurrency(contract.current_total_price)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Prazo Atual</p>
                        <p className="font-semibold">
                          {contract.current_total_delivery_days} dias
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Assinatura</p>
                        <p className="font-semibold text-sm">
                          {contract.signed_at
                            ? format(new Date(contract.signed_at), "dd/MM/yyyy", {
                                locale: ptBR,
                              })
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm">
                      Ver Detalhes
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
              ))}
            </div>
          )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
