import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Anchor, Gauge, Users, Fuel, Waves, Ship, Calendar, DollarSign, Hash } from "lucide-react";
import { formatCurrency } from "@/lib/quotation-utils";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

interface YachtModel {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  image_url?: string | null;
  base_price: number;
  base_delivery_days: number;
  length_overall?: number | null;
  beam?: number | null;
  draft?: number | null;
  hull_length?: number | null;
  height_from_waterline?: number | null;
  displacement_light?: number | null;
  displacement_loaded?: number | null;
  dry_weight?: number | null;
  fuel_capacity?: number | null;
  water_capacity?: number | null;
  cabins?: number | null;
  bathrooms?: string | null;
  passengers_capacity?: number | null;
  engines?: string | null;
  max_speed?: number | null;
  cruise_speed?: number | null;
  range_nautical_miles?: number | null;
  hull_color?: string | null;
}

interface HullNumberData {
  id: string;
  hull_number: string;
  brand: string;
  hull_entry_date: string;
  estimated_delivery_date: string;
}

interface ModelBaseTabProps {
  model: YachtModel;
  hullNumberData?: HullNumberData;
}

export function ModelBaseTab({ model, hullNumberData }: ModelBaseTabProps) {
  // DEBUG: Verificar se hullNumberData está chegando
  console.log('🔍 ModelBaseTab - hullNumberData:', hullNumberData);
  console.log('🔍 ModelBaseTab - model:', model?.name);

  const formatNumber = (value?: number | null, unit?: string) => {
    if (!value) return "N/A";
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
  };

  const formatFeet = (meters?: number | null) => {
    if (!meters) return "";
    const feet = meters * 3.28084;
    return ` (${feet.toFixed(2)} ft)`;
  };

  const formatDeliveryDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = parseISO(dateString);
      return format(date, "dd/MM/yyyy", { locale: ptBR });
    } catch {
      return "N/A";
    }
  };

  const hasAnyDimension = model.length_overall || model.hull_length || model.beam || model.draft || model.height_from_waterline;
  const hasAnyWeight = model.displacement_light || model.displacement_loaded || model.dry_weight || model.fuel_capacity || model.water_capacity;
  const hasAnyAccommodation = model.cabins || model.bathrooms || model.passengers_capacity;
  const hasAnyPerformance = model.engines || model.max_speed || model.cruise_speed || model.range_nautical_miles;

  return (
    <div className="space-y-6">
      {/* Card Principal - Informações Básicas */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div className="space-y-1">
              <CardTitle className="text-2xl flex items-center gap-2">
                <Ship className="h-6 w-6 text-primary" />
                {model.name}
              </CardTitle>
              <Badge variant="outline" className="font-mono">
                {model.code}
              </Badge>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              {hullNumberData && (
                <div className="flex items-center gap-2 bg-secondary px-4 py-2 rounded-lg">
                  <Hash className="h-5 w-5 text-secondary-foreground" />
                  <div className="text-right">
                    <p className="text-xs text-secondary-foreground/70">Matrícula</p>
                    <p className="font-bold text-secondary-foreground">{hullNumberData.hull_number}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg">
                <DollarSign className="h-5 w-5" />
                <div className="text-right">
                  <p className="text-xs opacity-70">Preço Base</p>
                  <p className="font-bold">{formatCurrency(model.base_price)}</p>
                </div>
              </div>
              {hullNumberData?.estimated_delivery_date && (
                <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Entrega Prevista</p>
                    <p className="font-bold">{formatDeliveryDate(hullNumberData.estimated_delivery_date)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {model.image_url && (
            <div className="overflow-hidden rounded-lg">
              <img
                src={model.image_url}
                alt={model.name}
                className="w-full h-64 md:h-80 object-cover"
              />
            </div>
          )}
          {model.description && (
            <p className="text-muted-foreground leading-relaxed">
              {model.description}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Dimensões */}
      {hasAnyDimension && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Anchor className="h-5 w-5 text-primary" />
              Dimensões Principais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {model.length_overall && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Comprimento Total (LOA)</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(model.length_overall, "m")}{formatFeet(model.length_overall)}
                  </span>
                </div>
              )}
              
              {model.hull_length && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Comprimento do Casco</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(model.hull_length, "m")}{formatFeet(model.hull_length)}
                  </span>
                </div>
              )}
              
              {model.beam && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Boca (Beam)</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(model.beam, "m")}{formatFeet(model.beam)}
                  </span>
                </div>
              )}
              
              {model.draft && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Calado (Draft)</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(model.draft, "m")}{formatFeet(model.draft)}
                  </span>
                </div>
              )}
              
              {model.height_from_waterline && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Altura da Linha d'Água</span>
                  <span className="text-sm font-semibold">
                    {formatNumber(model.height_from_waterline, "m")}{formatFeet(model.height_from_waterline)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pesos e Capacidades */}
      {hasAnyWeight && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Waves className="h-5 w-5 text-primary" />
              Pesos e Capacidades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {model.displacement_light && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Deslocamento Leve</span>
                  <span className="text-sm font-semibold">{formatNumber(model.displacement_light, "kg")}</span>
                </div>
              )}
              
              {model.displacement_loaded && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Deslocamento Carregado</span>
                  <span className="text-sm font-semibold">{formatNumber(model.displacement_loaded, "kg")}</span>
                </div>
              )}
              
              {model.dry_weight && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Peso Seco</span>
                  <span className="text-sm font-semibold">{formatNumber(model.dry_weight, "kg")}</span>
                </div>
              )}
              
              {model.fuel_capacity && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">
                    <Fuel className="h-4 w-4 inline mr-2" />
                    Capacidade de Combustível
                  </span>
                  <span className="text-sm font-semibold">{formatNumber(model.fuel_capacity, "L")}</span>
                </div>
              )}
              
              {model.water_capacity && (
                <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Capacidade de Água</span>
                  <span className="text-sm font-semibold">{formatNumber(model.water_capacity, "L")}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acomodações e Performance */}
      {(hasAnyAccommodation || hasAnyPerformance) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Acomodações */}
          {hasAnyAccommodation && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Acomodações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {model.cabins && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Camarotes</span>
                      <span className="text-sm font-semibold">{model.cabins}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {model.bathrooms && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Banheiros</span>
                      <span className="text-sm font-semibold">{model.bathrooms}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {model.passengers_capacity && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Capacidade de Passageiros</span>
                    <span className="text-sm font-semibold">{model.passengers_capacity}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Performance */}
          {hasAnyPerformance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Gauge className="h-5 w-5 text-primary" />
                  Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {model.engines && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Motorização</span>
                      <span className="text-sm font-semibold">{model.engines}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {model.max_speed && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Velocidade Máxima</span>
                      <span className="text-sm font-semibold">{formatNumber(model.max_speed, "nós")}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {model.cruise_speed && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Velocidade de Cruzeiro</span>
                      <span className="text-sm font-semibold">{formatNumber(model.cruise_speed, "nós")}</span>
                    </div>
                    <Separator />
                  </>
                )}
                {model.range_nautical_miles && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Autonomia</span>
                    <span className="text-sm font-semibold">{formatNumber(model.range_nautical_miles, "milhas náuticas")}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Acabamento */}
      {model.hull_color && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acabamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Cor do Casco</span>
              <span className="text-sm font-semibold">{model.hull_color}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
