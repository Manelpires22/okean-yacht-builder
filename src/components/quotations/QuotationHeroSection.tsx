import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { Calendar } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuotationHeroSectionProps {
  yachtModel: {
    name: string;
    code: string;
    description?: string;
    image_url?: string;
  };
  basePrice: number;
  upgradesPrice: number;
  optionsPrice: number;
  customizationsPrice: number;
  finalPrice: number;
  baseDeliveryDays: number;
  totalDeliveryDays: number;
  discountAmount?: number;
  estimatedDeliveryDate?: string;
  hullNumber?: string;
}

export function QuotationHeroSection({
  yachtModel,
  basePrice,
  upgradesPrice,
  optionsPrice,
  customizationsPrice,
  finalPrice,
  baseDeliveryDays,
  totalDeliveryDays,
  discountAmount = 0,
  estimatedDeliveryDate,
  hullNumber
}: QuotationHeroSectionProps) {
  // Valor inicial = soma de todos os componentes (sem descontos)
  const valorInicial = basePrice + upgradesPrice + optionsPrice + customizationsPrice;
  
  // O finalPrice passado já inclui todos os descontos (base + opcionais + upgrades)
  // Calcular economia/desconto real baseado na diferença
  const savings = discountAmount || (valorInicial - finalPrice);
  const savingsPercentage = valorInicial > 0 ? ((savings / valorInicial) * 100).toFixed(1) : '0';
  
  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Resumo da Proposta Comercial
        </h1>
        <p className="text-muted-foreground mt-1">
          Configuração completa e valores da embarcação
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Modelo do Iate */}
      <Card className="overflow-hidden">
        <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-primary/5">
          {yachtModel.image_url && (
            <img
              src={yachtModel.image_url}
              alt={yachtModel.name}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
            <h3 className="text-2xl sm:text-3xl font-bold mb-2">{yachtModel.name}</h3>
            {yachtModel.code && (
              <p className="text-sm opacity-90">Código: {yachtModel.code}</p>
            )}
          </div>
        </div>
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">{yachtModel.name}</h2>
              <p className="text-sm text-muted-foreground">Código: {yachtModel.code}</p>
              {yachtModel.description && (
                <p className="text-sm mt-2 line-clamp-2">{yachtModel.description}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo Financeiro Destacado */}
      <Card className="bg-gradient-to-br from-primary/5 via-background to-background border-primary/20">
        <CardContent className="p-6 space-y-6">
          {/* Prazo de Entrega */}
          <div>
            <p className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {estimatedDeliveryDate ? "Entrega Prevista" : "Prazo de Entrega"}
            </p>
            <p className="text-2xl font-bold">
              {estimatedDeliveryDate 
                ? format(new Date(estimatedDeliveryDate), "dd/MM/yyyy", { locale: ptBR })
                : formatDays(totalDeliveryDays)}
            </p>
            {hullNumber && (
              <p className="text-sm text-muted-foreground mt-1">
                Matrícula: {hullNumber}
              </p>
            )}
            {!estimatedDeliveryDate && totalDeliveryDays > baseDeliveryDays && (
              <p className="text-sm text-muted-foreground mt-1">
                Base: {formatDays(baseDeliveryDays)} (+{totalDeliveryDays - baseDeliveryDays} dias de opcionais/customizações)
              </p>
            )}
          </div>

          {/* Breakdown Financeiro Detalhado */}
          <div className="pt-4 border-t space-y-3 text-sm">
            {/* Composição da Proposta */}
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Composição da Proposta
            </p>
            
            <div className="space-y-1.5">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Barco Base</span>
                <span className="font-medium">{formatCurrency(basePrice)}</span>
              </div>
              {upgradesPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Upgrades</span>
                  <span className="font-medium">{formatCurrency(upgradesPrice)}</span>
                </div>
              )}
              {optionsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Opcionais</span>
                  <span className="font-medium">{formatCurrency(optionsPrice)}</span>
                </div>
              )}
              {customizationsPrice > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Customizações</span>
                  <span className="font-medium">{formatCurrency(customizationsPrice)}</span>
                </div>
              )}
            </div>
            
            {/* Valor Inicial */}
            <div className="flex justify-between pt-2 border-t border-dashed">
              <span className="font-medium">Valor Inicial</span>
              <span className="font-semibold">{formatCurrency(valorInicial)}</span>
            </div>
            
            {/* Descontos */}
            {savings > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Descontos aplicados</span>
                <span className="font-medium">-{formatCurrency(savings)}</span>
              </div>
            )}
            
            {/* Valor Final da Proposta */}
            <div className="flex justify-between pt-3 border-t mt-2">
              <span className="font-semibold text-base">Valor Final da Proposta</span>
              <span className="font-bold text-lg text-primary">{formatCurrency(finalPrice)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
