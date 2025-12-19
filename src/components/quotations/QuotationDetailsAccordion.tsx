import { useState, useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { QuotationInfoGrid } from "./QuotationInfoGrid";
import { CustomizationStatusCard } from "./CustomizationStatusCard";
import { QuotationVersionHistory } from "./QuotationVersionHistory";
import { formatCurrency } from "@/lib/quotation-utils";
import { 
  FileText, 
  Settings, 
  Palette, 
  DollarSign, 
  GitBranch,
  Info,
  ArrowUpCircle
} from "lucide-react";

interface QuotationDetailsAccordionProps {
  quotation: any;
  defaultExpanded?: string[];
}

export function QuotationDetailsAccordion({ 
  quotation,
  defaultExpanded = ['general-info']
}: QuotationDetailsAccordionProps) {
  const [expanded, setExpanded] = useState<string[]>(defaultExpanded);
  
  // Memoizar contadores (evita recálculos a cada render)
  const { optionsCount, customizationsCount, pendingCustomizationsCount, upgradesCount, totalUpgradesPrice } = useMemo(() => ({
    optionsCount: quotation.quotation_options?.length || 0,
    customizationsCount: quotation.quotation_customizations?.length || 0,
    pendingCustomizationsCount: quotation.quotation_customizations?.filter(
      (c: any) => c.status === 'pending'
    ).length || 0,
    upgradesCount: quotation.quotation_upgrades?.length || 0,
    totalUpgradesPrice: quotation.quotation_upgrades?.reduce(
      (sum: number, u: any) => sum + (u.price || 0), 0
    ) || 0,
  }), [quotation.quotation_options, quotation.quotation_customizations, quotation.quotation_upgrades]);

  // Criar mapa para customizações por option_id (O(1) lookup)
  const customizationsByOptionId = useMemo(() => {
    if (!quotation.quotation_customizations) return new Map();
    return new Map(
      quotation.quotation_customizations
        .filter((c: any) => c.option_id)
        .map((c: any) => [c.option_id, c])
    );
  }, [quotation.quotation_customizations]);

  return (
    <Accordion 
      type="multiple" 
      value={expanded}
      onValueChange={setExpanded}
      className="space-y-4"
    >
      {/* Informações Gerais */}
      <AccordionItem value="general-info" className="border rounded-lg px-6 bg-card">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Info className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Informações Gerais</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <QuotationInfoGrid
            client={{
              name: quotation.clients?.name || quotation.client_name,
              company: quotation.clients?.company,
              email: quotation.clients?.email || quotation.client_email,
              phone: quotation.clients?.phone || quotation.client_phone,
            }}
            seller={{
              name: quotation.users?.full_name || 'N/A',
            }}
            quotation={{
              createdAt: quotation.created_at,
              validUntil: quotation.valid_until,
            }}
          />
        </AccordionContent>
      </AccordionItem>

      {/* Opcionais Selecionados */}
      {optionsCount > 0 && (
        <AccordionItem value="options" className="border rounded-lg px-6 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                <Settings className="h-4 w-4 text-secondary-foreground" />
              </div>
              <span className="font-semibold">Opcionais Selecionados</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {optionsCount} {optionsCount === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            {quotation.quotation_options.map((opt: any) => {
              // Buscar customização usando Map (O(1) em vez de O(n))
              const optionCustomization = customizationsByOptionId.get(opt.option_id);

              return (
                <div
                  key={opt.id}
                  className="flex justify-between items-start p-3 border rounded-lg bg-muted/30"
                >
                  <div className="flex-1">
                    <p className="font-medium">{opt.options?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Código: {opt.options?.code}
                    </p>
                    {opt.options?.description && (
                      <p className="text-sm mt-1 text-muted-foreground">
                        {opt.options.description}
                      </p>
                    )}
                    {optionCustomization && (
                      <div className="mt-2 p-2 bg-accent/30 rounded border border-accent">
                        <p className="text-xs font-semibold text-accent-foreground mb-1">
                          ✏️ Customização Solicitada:
                        </p>
                        <p className="text-sm text-accent-foreground">
                          {optionCustomization.notes}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-muted-foreground">
                      Qtd: {opt.quantity}
                    </p>
                    <p className="font-semibold">
                      {formatCurrency(opt.total_price)}
                    </p>
                    {opt.delivery_days_impact > 0 && (
                      <p className="text-xs text-muted-foreground">
                        +{opt.delivery_days_impact} dias
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Total de Opcionais</span>
              <span>{formatCurrency(quotation.total_options_price || 0)}</span>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Upgrades Selecionados */}
      {upgradesCount > 0 && (
        <AccordionItem value="upgrades" className="border rounded-lg px-6 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4 text-amber-600" />
              </div>
              <span className="font-semibold">Upgrades Selecionados</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {upgradesCount} {upgradesCount === 1 ? 'item' : 'itens'}
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4 space-y-3">
            {quotation.quotation_upgrades.map((upg: any) => (
              <div key={upg.id} className="flex justify-between items-start p-3 border rounded-lg bg-muted/30">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">
                    Substituição de: {upg.memorial_items?.item_name || 'Item do memorial'}
                  </p>
                  <p className="font-medium">{upg.memorial_upgrades?.name}</p>
                  {upg.memorial_upgrades?.description && (
                    <p className="text-sm mt-1 text-muted-foreground">
                      {upg.memorial_upgrades.description}
                    </p>
                  )}
                  {upg.customization_notes && (
                    <div className="mt-2 p-2 bg-accent/30 rounded border border-accent">
                      <p className="text-xs font-semibold text-accent-foreground mb-1">
                        ✏️ Notas de Customização:
                      </p>
                      <p className="text-sm text-accent-foreground">
                        {upg.customization_notes}
                      </p>
                    </div>
                  )}
                </div>
                <div className="text-right ml-4">
                  <p className="font-semibold text-amber-600">
                    +{formatCurrency(upg.price)}
                  </p>
                  {upg.delivery_days_impact > 0 && (
                    <p className="text-xs text-muted-foreground">
                      +{upg.delivery_days_impact} dias
                    </p>
                  )}
                </div>
              </div>
            ))}
            <Separator />
            <div className="flex justify-between items-center font-semibold">
              <span>Total de Upgrades</span>
              <span className="text-amber-600">
                +{formatCurrency(totalUpgradesPrice)}
              </span>
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Customizações */}
      {customizationsCount > 0 && (
        <AccordionItem value="customizations" className="border rounded-lg px-6 bg-card">
          <AccordionTrigger className="hover:no-underline">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center">
                <Palette className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="font-semibold">Customizações</span>
              <div className="flex gap-2 ml-auto mr-4">
                {pendingCustomizationsCount > 0 && (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    {pendingCustomizationsCount} pendente{pendingCustomizationsCount > 1 ? 's' : ''}
                  </Badge>
                )}
                <Badge variant="secondary">
                  {customizationsCount} total
                </Badge>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-4">
            <CustomizationStatusCard
              quotationId={quotation.id}
              customizations={quotation.quotation_customizations.map((c: any) => ({
                id: c.id,
                item_name: c.item_name,
                notes: c.notes,
                quantity: c.quantity,
                status: c.status || 'pending',
                additional_cost: c.additional_cost,
                delivery_impact_days: c.delivery_impact_days,
                engineering_notes: c.engineering_notes,
                file_paths: c.file_paths
              }))}
            />
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Detalhamento Financeiro */}
      <AccordionItem value="financial" className="border rounded-lg px-6 bg-card">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold">Detalhamento Financeiro</span>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4 space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço Base do Modelo</span>
              <span className="font-medium">{formatCurrency(quotation.base_price)}</span>
            </div>
            
            {quotation.base_discount_percentage > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Desconto sobre Base ({quotation.base_discount_percentage}%)</span>
                <span className="font-medium">
                  -{formatCurrency(quotation.base_price * (quotation.base_discount_percentage / 100))}
                </span>
              </div>
            )}
            
            <div className="flex justify-between">
              <span className="font-medium">Preço Base Final</span>
              <span className="font-semibold">{formatCurrency(quotation.final_base_price)}</span>
            </div>
          </div>

          <Separator />

          {optionsCount > 0 && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total de Opcionais</span>
                  <span className="font-medium">
                    {formatCurrency(quotation.total_options_price || 0)}
                  </span>
                </div>
                
                {quotation.options_discount_percentage > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto sobre Opcionais ({quotation.options_discount_percentage}%)</span>
                    <span className="font-medium">
                      -{formatCurrency((quotation.total_options_price || 0) * (quotation.options_discount_percentage / 100))}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="font-medium">Opcionais Final</span>
                  <span className="font-semibold">{formatCurrency(quotation.final_options_price || 0)}</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {upgradesCount > 0 && (
            <>
              <div className="flex justify-between text-amber-600">
                <span className="font-medium">Total de Upgrades</span>
                <span className="font-semibold">
                  +{formatCurrency(totalUpgradesPrice)}
                </span>
              </div>
              <Separator />
            </>
          )}

          {quotation.total_customizations_price > 0 && (
            <>
              <div className="flex justify-between text-primary">
                <span className="font-medium">Customizações Aprovadas</span>
                <span className="font-semibold">
                  +{formatCurrency(quotation.total_customizations_price)}
                </span>
              </div>
              <Separator />
            </>
          )}

          <div className="flex justify-between text-lg font-bold pt-2">
            <span>Valor Total</span>
            <span className="text-primary">{formatCurrency(quotation.final_price)}</span>
          </div>
        </AccordionContent>
      </AccordionItem>

      {/* Histórico de Versões */}
      <AccordionItem value="versions" className="border rounded-lg px-6 bg-card">
        <AccordionTrigger className="hover:no-underline">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </div>
            <span className="font-semibold">Histórico de Versões</span>
            <Badge variant="outline" className="ml-auto mr-4">
              v{quotation.version || 1}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="pt-4">
          <QuotationVersionHistory
            quotationId={quotation.id}
          />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
