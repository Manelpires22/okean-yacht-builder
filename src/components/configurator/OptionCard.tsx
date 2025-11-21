import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/quotation-utils";
import { Check, Plus, MessageSquare, Edit } from "lucide-react";

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
  customizationNotes?: string;
  onToggle: () => void;
  onCustomize?: () => void;
}

export function OptionCard({ option, isSelected, customizationNotes, onToggle, onCustomize }: OptionCardProps) {
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm sm:text-base break-words">{option.name}</CardTitle>
            <CardDescription className="font-mono text-xs">
              {option.code}
            </CardDescription>
          </div>
          {isSelected && (
            <Badge variant="default" className="shrink-0">
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

        {customizationNotes && (
          <div className="p-2 bg-muted rounded-md border border-border">
            <div className="flex items-start gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-2">
                {customizationNotes}
              </p>
            </div>
          </div>
        )}
        
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base sm:text-lg font-bold">
              {formatCurrency(Number(option.base_price))}
            </p>
            {option.delivery_days_impact && option.delivery_days_impact > 0 ? (
              <p className="text-xs text-muted-foreground">
                +{option.delivery_days_impact} dias
              </p>
            ) : null}
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            {isSelected && onCustomize && (
              <Button
                variant="outline"
                size="sm"
                onClick={onCustomize}
                title="Customizar opcional"
                className="flex-1 sm:flex-initial"
              >
                <Edit className="h-4 w-4 sm:mr-0" />
                <span className="sm:hidden ml-2">Editar</span>
              </Button>
            )}
            <Button
              variant={isSelected ? "outline" : "default"}
              size="sm"
              onClick={onToggle}
              className="flex-1 sm:flex-initial"
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
        </div>
      </CardContent>
    </Card>
  );
}
