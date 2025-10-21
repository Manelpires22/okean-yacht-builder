import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/quotation-utils";
import { Check, Plus } from "lucide-react";

interface OptionCardProps {
  option: {
    id: string;
    code: string;
    name: string;
    description?: string;
    base_price: number;
    delivery_days_impact?: number;
    image_url?: string;
  };
  isSelected: boolean;
  onToggle: () => void;
}

export function OptionCard({ option, isSelected, onToggle }: OptionCardProps) {
  return (
    <Card className={isSelected ? "border-primary" : ""}>
      <CardHeader>
        {option.image_url ? (
          <img
            src={option.image_url}
            alt={option.name}
            className="w-full h-32 object-cover rounded-md mb-2"
          />
        ) : (
          <div className="w-full h-32 bg-muted rounded-md mb-2" />
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base">{option.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {option.code}
            </CardDescription>
          </div>
          {isSelected && (
            <Badge variant="default" className="ml-2">
              <Check className="h-3 w-3 mr-1" />
              Selecionado
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {option.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {option.description}
          </p>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold">
              {formatCurrency(Number(option.base_price))}
            </p>
            {option.delivery_days_impact && option.delivery_days_impact > 0 ? (
              <p className="text-xs text-muted-foreground">
                +{option.delivery_days_impact} dias
              </p>
            ) : null}
          </div>
          
          <Button
            variant={isSelected ? "outline" : "default"}
            size="sm"
            onClick={onToggle}
          >
            {isSelected ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Remover
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-1" />
                Adicionar
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
