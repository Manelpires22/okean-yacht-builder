import { Contract } from "@/hooks/useContracts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Ship, User, Calendar } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { LinkedCustomizationsCard } from "./LinkedCustomizationsCard";

interface ContractOverviewProps {
  contract: Contract;
}

export function ContractOverview({ contract }: ContractOverviewProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações do Contrato</CardTitle>
          <CardDescription>Dados gerais do contrato de construção</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Número do Contrato</p>
              <p className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {contract.contract_number}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cotação Original</p>
              <p className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                {contract.quotation?.quotation_number || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Modelo de Iate</p>
              <p className="font-semibold flex items-center gap-2">
                <Ship className="h-4 w-4" />
                {contract.yacht_model?.name || "N/A"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Cliente</p>
              <p className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                {contract.client?.name || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Valores e Prazos</CardTitle>
          <CardDescription>Consolidação de preços e prazos de entrega</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout vertical: Base → Total em cada coluna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Coluna VALORES */}
            <div className="space-y-6">
              {/* Preço Base */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Preço Base (Contrato Original)</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(contract.base_price)}
                </p>
              </div>

              {/* Valor Total Atual */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor Total Atual (com ATOs)</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(contract.current_total_price)}
                </p>
                {contract.current_total_price !== contract.base_price && (
                  <Badge className="mt-2 bg-primary">
                    +{formatCurrency(contract.current_total_price - contract.base_price)} em ATOs
                  </Badge>
                )}
              </div>
            </div>

            {/* Coluna PRAZOS */}
            <div className="space-y-6">
              {/* Prazo Base */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prazo Base</p>
                <p className="text-2xl font-bold text-primary">
                  {contract.base_delivery_days} dias
                </p>
              </div>

              {/* Prazo Total Atual */}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Prazo Total Atual</p>
                <p className="text-3xl font-bold">
                  {contract.current_total_delivery_days} dias
                </p>
                {contract.current_total_delivery_days !== contract.base_delivery_days && (
                  <Badge className="mt-2 bg-primary">
                    +{contract.current_total_delivery_days - contract.base_delivery_days} dias em ATOs
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assinatura do Contrato</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Data de Assinatura:</span>
            <span className="font-semibold">
              {contract.signed_at
                ? format(new Date(contract.signed_at), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })
                : "N/A"}
            </span>
          </div>

          {contract.signed_by_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Assinado por:</span>
              <span className="font-semibold">{contract.signed_by_name}</span>
            </div>
          )}

          {contract.signed_by_email && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Email:</span>
              <span className="font-semibold">{contract.signed_by_email}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <LinkedCustomizationsCard 
        contractId={contract.id}
        quotationId={contract.quotation_id}
      />
    </div>
  );
}
