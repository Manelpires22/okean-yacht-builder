import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Anchor, Gauge, Users, Fuel, Waves, Ship } from "lucide-react";

interface YachtSpecificationsProps {
  model: {
    name: string;
    code: string;
    description?: string;
    length_overall?: number;
    beam?: number;
    draft?: number;
    hull_length?: number;
    height_from_waterline?: number;
    displacement_light?: number;
    displacement_loaded?: number;
    dry_weight?: number;
    fuel_capacity?: number;
    water_capacity?: number;
    cabins?: number;
    bathrooms?: string;
    passengers_capacity?: number;
    engines?: string;
    max_speed?: number;
    cruise_speed?: number;
    range_nautical_miles?: number;
    hull_color?: string;
  };
}

export function YachtSpecifications({ model }: YachtSpecificationsProps) {
  const formatNumber = (value?: number, unit?: string) => {
    if (!value) return "N/A";
    return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}${unit ? ` ${unit}` : ""}`;
  };

  const formatFeet = (meters?: number) => {
    if (!meters) return "";
    const feet = meters * 3.28084;
    return ` (${feet.toFixed(2)} ft)`;
  };

  return (
    <div className="space-y-6">
      {/* Descrição */}
      {model.description && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Ship className="h-5 w-5 text-primary" />
              Sobre o Modelo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground leading-relaxed">{model.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Dimensões */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Anchor className="h-5 w-5 text-primary" />
            Dimensões Principais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* Pesos e Capacidades */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Waves className="h-5 w-5 text-primary" />
            Pesos e Capacidades
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
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

      {/* Acomodações e Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Acomodações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Acomodações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {model.cabins && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Camarotes</span>
                <span className="text-sm font-semibold">{model.cabins}</span>
              </div>
            )}
            <Separator />
            {model.bathrooms && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Banheiros</span>
                <span className="text-sm font-semibold">{model.bathrooms}</span>
              </div>
            )}
            <Separator />
            {model.passengers_capacity && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Capacidade de Passageiros</span>
                <span className="text-sm font-semibold">{model.passengers_capacity}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Gauge className="h-5 w-5 text-primary" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {model.engines && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Motorização</span>
                <span className="text-sm font-semibold">{model.engines}</span>
              </div>
            )}
            <Separator />
            {model.max_speed && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Velocidade Máxima</span>
                <span className="text-sm font-semibold">{formatNumber(model.max_speed, "nós")}</span>
              </div>
            )}
            <Separator />
            {model.cruise_speed && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Velocidade de Cruzeiro</span>
                <span className="text-sm font-semibold">{formatNumber(model.cruise_speed, "nós")}</span>
              </div>
            )}
            <Separator />
            {model.range_nautical_miles && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Autonomia</span>
                <span className="text-sm font-semibold">{formatNumber(model.range_nautical_miles, "milhas náuticas")}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
