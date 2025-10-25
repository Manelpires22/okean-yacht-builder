import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Calendar, XCircle } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuotationStatusChecklistProps {
  status: string;
  baseDiscountPercentage: number;
  optionsDiscountPercentage: number;
  hasCustomizations: boolean;
  customizationsApproved: boolean;
  validUntil: string;
  commercialApprovalStatus?: string;
  technicalApprovalStatus?: string;
}

export function QuotationStatusChecklist({
  status,
  baseDiscountPercentage,
  optionsDiscountPercentage,
  hasCustomizations,
  customizationsApproved,
  validUntil,
  commercialApprovalStatus,
  technicalApprovalStatus
}: QuotationStatusChecklistProps) {
  const maxDiscount = Math.max(baseDiscountPercentage, optionsDiscountPercentage);
  const needsCommercialApproval = maxDiscount > 10;
  const commercialApproved = commercialApprovalStatus === 'approved' || !needsCommercialApproval;
  const technicalApproved = !hasCustomizations || customizationsApproved;
  
  const validUntilDate = new Date(validUntil);
  const daysRemaining = differenceInDays(validUntilDate, new Date());
  const isExpired = daysRemaining < 0;
  const isExpiringSoon = daysRemaining <= 7 && daysRemaining >= 0;

  const getCommercialMessage = () => {
    if (!needsCommercialApproval) {
      return "Desconto dentro da política (não requer aprovação)";
    }
    if (commercialApproved) {
      return "Desconto aprovado pela gerência comercial";
    }
    if (maxDiscount > 15) {
      return `Desconto de ${maxDiscount.toFixed(1)}% requer aprovação do administrador`;
    }
    return `Desconto de ${maxDiscount.toFixed(1)}% requer aprovação do gerente comercial`;
  };

  const getTechnicalMessage = () => {
    if (!hasCustomizations) {
      return "Sem customizações técnicas";
    }
    if (technicalApproved) {
      return "Todas as customizações foram validadas";
    }
    return "Customizações aguardando validação da engenharia";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Status da Proposta</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Aprovação Comercial */}
        <div className="flex items-start gap-3">
          {commercialApproved ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
          ) : (
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">Aprovação Comercial</p>
            <p className="text-sm text-muted-foreground">
              {getCommercialMessage()}
            </p>
          </div>
          {needsCommercialApproval && (
            <Badge variant={commercialApproved ? "default" : "secondary"}>
              {commercialApproved ? "Aprovado" : "Pendente"}
            </Badge>
          )}
        </div>

        {/* Validação Técnica */}
        {hasCustomizations && (
          <div className="flex items-start gap-3">
            {technicalApproved ? (
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium">Validação Técnica</p>
              <p className="text-sm text-muted-foreground">
                {getTechnicalMessage()}
              </p>
            </div>
            <Badge variant={technicalApproved ? "default" : "secondary"}>
              {technicalApproved ? "Validado" : "Pendente"}
            </Badge>
          </div>
        )}

        {/* Validade */}
        <div className="flex items-start gap-3">
          {isExpired ? (
            <XCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          ) : isExpiringSoon ? (
            <Clock className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          ) : (
            <Calendar className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium">Validade</p>
            <p className="text-sm text-muted-foreground">
              {isExpired ? (
                <>Expirou em {format(validUntilDate, "dd/MM/yyyy", { locale: ptBR })}</>
              ) : (
                <>
                  Válida até {format(validUntilDate, "dd/MM/yyyy", { locale: ptBR })}
                  {" "}({daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restante{daysRemaining === 1 ? '' : 's'})
                </>
              )}
            </p>
          </div>
          {isExpiringSoon && !isExpired && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              Expira em breve
            </Badge>
          )}
        </div>

        {/* Status Final */}
        {status === 'ready_to_send' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm font-medium text-green-900">
              ✓ Proposta pronta para enviar ao cliente
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
