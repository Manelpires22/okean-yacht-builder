import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CustomizationDialog } from "./CustomizationDialog";
import { Edit, CheckCircle2 } from "lucide-react";
import { Customization } from "@/hooks/useConfigurationState";

interface MemorialDescritivoProps {
  yachtModelId: string;
  modelName: string;
  customizations: Customization[];
  onAddCustomization: (customization: Customization) => void;
  onRemoveCustomization: (itemId: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  conves_principal: 'Convés Principal',
  salao: 'Salão',
  area_jantar: 'Área de Jantar',
  lavabo: 'Lavabo',
  area_cozinha: 'Área da Cozinha',
  cozinha_galley: 'Cozinha/Galley',
  comando_principal: 'Comando Principal',
  flybridge: 'Flybridge',
  lobby_conves_inferior: 'Lobby Convés Inferior',
  cabine_master: 'Cabine Master',
  banheiro_master: 'Banheiro Master',
  cabine_vip: 'Cabine VIP',
  cabine_vip_proa: 'Cabine VIP Proa',
  banheiro_vip: 'Banheiro VIP',
  cabine_hospedes_bombordo: 'Cabine Hóspedes Bombordo',
  banheiro_hospedes_bombordo: 'Banheiro Hóspedes Bombordo',
  cabine_hospedes_boreste: 'Cabine Hóspedes Boreste',
  banheiro_hospedes_boreste: 'Banheiro Hóspedes Boreste',
  banheiro_hospedes_compartilhado: 'Banheiro Hóspedes Compartilhado',
  banheiro_capitao: 'Banheiro Capitão',
  cabine_capitao: 'Cabine Capitão',
  banheiro_tripulacao: 'Banheiro Tripulação',
  cabine_tripulacao: 'Cabine Tripulação',
  lobby_tripulacao: 'Lobby Tripulação',
  sala_maquinas: 'Sala de Máquinas',
  garagem: 'Garagem',
  propulsao_controle: 'Propulsão e Controle',
  sistema_estabilizacao: 'Sistema de Estabilização',
  equipamentos_eletronicos: 'Equipamentos Eletrônicos',
  sistema_extincao_incendio: 'Sistema de Extinção de Incêndio',
  sistema_ar_condicionado: 'Sistema Ar-Condicionado',
  sistema_bombas_porao: 'Sistema de Bombas de Porão',
  sistema_agua_sanitario: 'Sistema de Água e Sanitário',
  eletrica: 'Sistema Elétrico',
  seguranca: 'Segurança e Salvatagem',
  audiovisual_entretenimento: 'Audiovisual e Entretenimento',
};

export function MemorialDescritivo({ 
  yachtModelId, 
  modelName,
  customizations,
  onAddCustomization,
  onRemoveCustomization,
}: MemorialDescritivoProps) {
  const [customizationDialog, setCustomizationDialog] = useState<{
    open: boolean;
    itemId: string;
    itemName: string;
    defaultQuantity?: number;
  } | null>(null);
  const { data: items, isLoading } = useQuery({
    queryKey: ['memorial-items-public', yachtModelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('memorial_items')
        .select('*')
        .eq('yacht_model_id', yachtModelId)
        .eq('is_active', true)
        .order('display_order');
      
      if (error) throw error;
      return data;
    },
    enabled: !!yachtModelId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!items || items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
          <CardDescription>Especificações técnicas não disponíveis</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, typeof items>);

  const getCustomization = (itemId: string) => {
    return customizations.find((c) => c.memorial_item_id === itemId);
  };

  const handleOpenCustomization = (itemId: string, itemName: string, quantity?: number) => {
    setCustomizationDialog({
      open: true,
      itemId,
      itemName,
      defaultQuantity: quantity,
    });
  };

  const handleSaveCustomization = (data: { notes: string; quantity?: number }) => {
    if (customizationDialog) {
      onAddCustomization({
        memorial_item_id: customizationDialog.itemId,
        item_name: customizationDialog.itemName,
        notes: data.notes,
        quantity: data.quantity,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Memorial Descritivo - {modelName}</CardTitle>
        <CardDescription>
          Especificações técnicas e características do modelo base
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedItems).map(([category, categoryItems], index) => (
            <AccordionItem key={index} value={`category-${index}`}>
              <AccordionTrigger className="text-left">
                {CATEGORY_LABELS[category] || category}
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {categoryItems.map((item) => {
                    const customization = getCustomization(item.id);
                    const hasCustomization = !!customization;

                    return (
                      <div key={item.id} className="border-l-2 border-primary pl-4 py-2">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="font-medium">{item.item_name}</p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {item.description}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                              {item.brand && <span>Marca: {item.brand}</span>}
                              {item.brand && item.model && <span>•</span>}
                              {item.model && <span>Modelo: {item.model}</span>}
                              {(item.brand || item.model) && <span>•</span>}
                              <span>{item.quantity} {item.unit}</span>
                            </div>

                            {hasCustomization && (
                              <div className="mt-2 p-2 bg-accent/50 rounded-md">
                                <p className="text-xs font-medium text-accent-foreground mb-1">
                                  Customização solicitada:
                                </p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {customization.notes}
                                </p>
                              </div>
                            )}
                          </div>

                          {item.is_customizable && (
                            <div className="flex flex-col gap-2 shrink-0">
                              {hasCustomization ? (
                                <>
                                  <Badge variant="default" className="gap-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Customizado
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleOpenCustomization(item.id, item.item_name, item.quantity)}
                                  >
                                    <Edit className="h-3 w-3 mr-1" />
                                    Editar
                                  </Button>
                                </>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenCustomization(item.id, item.item_name, item.quantity)}
                                >
                                  <Edit className="h-3 w-3 mr-1" />
                                  Customizar
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>

      {customizationDialog && (
        <CustomizationDialog
          open={customizationDialog.open}
          onOpenChange={(open) => !open && setCustomizationDialog(null)}
          itemId={customizationDialog.itemId}
          itemName={customizationDialog.itemName}
          defaultQuantity={customizationDialog.defaultQuantity}
          existingCustomization={getCustomization(customizationDialog.itemId)}
          onSave={handleSaveCustomization}
        />
      )}
    </Card>
  );
}
