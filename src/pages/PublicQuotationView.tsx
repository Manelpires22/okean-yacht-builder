import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { QuotationHeroSection } from "@/components/quotations/QuotationHeroSection";
import { QuotationDetailsAccordion } from "@/components/quotations/QuotationDetailsAccordion";
import { YachtSpecifications } from "@/components/quotations/YachtSpecifications";
import { MemorialDescritivoAccordion } from "@/components/quotations/MemorialDescritivoAccordion";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Ship, FileText, Settings, DollarSign, Calendar, User } from "lucide-react";
import { useState } from "react";

export default function PublicQuotationView() {
  const { id, token } = useParams<{ id: string; token: string }>();
  const [expanded, setExpanded] = useState<string[]>(['general-info', 'specifications']);

  // Buscar cotação usando token seguro
  const { data: quotation, isLoading, error } = useQuery({
    queryKey: ['public-quotation', id, token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quotations')
        .select(`
          *,
          yacht_models (*),
          clients (*),
          users!quotations_sales_representative_id_fkey (
            id,
            full_name,
            email,
            department
          ),
          quotation_options (
            *,
            options (
              id,
              code,
              name,
              description,
              base_price
            )
          ),
          quotation_upgrades (
            id,
            price,
            memorial_item_id,
            upgrade_id,
            delivery_days_impact
          ),
          quotation_customizations (*),
          hull_number:hull_numbers (
            id,
            hull_number,
            brand,
            estimated_delivery_date
          )
        `)
        .eq('id', id!)
        .eq('secure_token', token!)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id && !!token
  });

  // Buscar memorial descritivo
  const { data: memorialItems } = useQuery({
    queryKey: ['memorial-items', quotation?.yacht_model_id],
    queryFn: async () => {
      const { data } = await supabase
        .from('memorial_items')
        .select(`
          *,
          memorial_categories!inner (
            id,
            label,
            icon,
            display_order
          )
        `)
        .eq('yacht_model_id', quotation!.yacht_model_id)
        .eq('is_active', true)
        .order('category_display_order')
        .order('display_order');

      return data || [];
    },
    enabled: !!quotation?.yacht_model_id
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <div className="text-center">
          <Ship className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-lg text-muted-foreground">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !quotation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-background">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Proposta não encontrada</h2>
              <p className="text-muted-foreground">
                O link pode estar incorreto ou a proposta pode ter sido removida.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calcular totais por tipo
  const totalUpgradesPrice = quotation.quotation_upgrades?.reduce(
    (sum: number, u: any) => sum + (u.price || 0), 
    0
  ) || 0;
  
  const totalOptionsPrice = quotation.total_options_price || 0;
  const totalCustomizationsPrice = quotation.total_customizations_price || 0;

  const totalDiscount = 
    (quotation.base_price * ((quotation.base_discount_percentage || 0) / 100)) +
    (totalOptionsPrice * ((quotation.options_discount_percentage || 0) / 100));

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-background">
      {/* Header */}
      <div className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">OKEAN Yachts</h1>
              <p className="text-sm text-muted-foreground">
                Proposta {quotation.quotation_number}
              </p>
            </div>
            <Badge variant={quotation.status === 'sent' ? 'default' : 'secondary'} className="text-sm">
              {quotation.status === 'sent' ? 'Enviada' : quotation.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <QuotationHeroSection
          yachtModel={{
            name: quotation.yacht_models?.name || 'N/A',
            code: quotation.yacht_models?.code || 'N/A',
            description: quotation.yacht_models?.description,
            image_url: quotation.yacht_models?.image_url,
          }}
          basePrice={quotation.base_price}
          upgradesPrice={totalUpgradesPrice}
          optionsPrice={totalOptionsPrice}
          customizationsPrice={totalCustomizationsPrice}
          finalPrice={quotation.final_price}
          baseDeliveryDays={quotation.base_delivery_days}
          totalDeliveryDays={quotation.total_delivery_days}
          discountAmount={totalDiscount}
          estimatedDeliveryDate={quotation.hull_number?.estimated_delivery_date}
          hullNumber={quotation.hull_number?.hull_number}
        />

        {/* Informações do Cliente e Validade */}
        <Card className="bg-card/50 backdrop-blur">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-semibold">{quotation.clients?.name || quotation.client_name}</p>
                  {quotation.clients?.company && (
                    <p className="text-sm text-muted-foreground">{quotation.clients.company}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Válida até</p>
                  <p className="font-semibold">
                    {format(new Date(quotation.valid_until), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Consultor</p>
                  <p className="font-semibold">{quotation.users?.full_name}</p>
                  <p className="text-sm text-muted-foreground">{quotation.users?.email}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accordions de Detalhes */}
        <Accordion 
          type="multiple" 
          value={expanded}
          onValueChange={setExpanded}
          className="space-y-4"
        >
          {/* Especificações do Modelo */}
          <AccordionItem value="specifications" className="border rounded-lg px-6 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Ship className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Especificações do Modelo</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4">
              <YachtSpecifications model={quotation.yacht_models} />
            </AccordionContent>
          </AccordionItem>

          {/* Memorial Descritivo */}
          {memorialItems && memorialItems.length > 0 && (
            <AccordionItem value="memorial" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-accent-foreground" />
                  </div>
                  <span className="font-semibold">Memorial Descritivo</span>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {memorialItems.length} itens
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4">
                <MemorialDescritivoAccordion items={memorialItems} />
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Opcionais */}
          {quotation.quotation_options && quotation.quotation_options.length > 0 && (
            <AccordionItem value="options" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-secondary-foreground" />
                  </div>
                  <span className="font-semibold">Itens Opcionais Selecionados</span>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {quotation.quotation_options.length} itens
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-3">
                {quotation.quotation_options.map((opt: any) => (
                  <div
                    key={opt.id}
                    className="flex justify-between items-start p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{opt.options?.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Código: {opt.options?.code}
                      </p>
                      {opt.options?.description && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {opt.options.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm text-muted-foreground">Qtd: {opt.quantity}</p>
                      <p className="font-semibold text-lg">{formatCurrency(opt.total_price)}</p>
                      {opt.delivery_days_impact > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          +{opt.delivery_days_impact} dias
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center font-semibold text-lg pt-2">
                  <span>Total de Opcionais</span>
                  <span>{formatCurrency(quotation.total_options_price || 0)}</span>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Customizações */}
          {quotation.quotation_customizations && quotation.quotation_customizations.length > 0 && (
            <AccordionItem value="customizations" className="border rounded-lg px-6 bg-card">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Settings className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-semibold">Customizações Solicitadas</span>
                  <Badge variant="secondary" className="ml-auto mr-4">
                    {quotation.quotation_customizations.length} itens
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-4 space-y-3">
                {quotation.quotation_customizations.map((custom: any) => (
                  <div
                    key={custom.id}
                    className="p-4 border rounded-lg bg-muted/30"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{custom.item_name}</p>
                        {custom.quantity && (
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {custom.quantity}
                          </p>
                        )}
                      </div>
                      <Badge 
                        variant={
                          custom.status === 'approved' ? 'default' : 
                          custom.status === 'rejected' ? 'destructive' : 
                          'secondary'
                        }
                      >
                        {custom.status === 'approved' ? 'Aprovada' : 
                         custom.status === 'rejected' ? 'Rejeitada' : 
                         'Pendente'}
                      </Badge>
                    </div>
                    
                    {custom.notes && (
                      <div className="mt-2 p-3 bg-background/50 rounded">
                        <p className="text-sm font-medium text-muted-foreground">Solicitação:</p>
                        <p className="text-sm mt-1">{custom.notes}</p>
                      </div>
                    )}

                    {custom.status === 'approved' && (
                      <div className="mt-3 space-y-2">
                        {custom.engineering_notes && (
                          <div className="p-3 bg-primary/5 rounded border border-primary/20">
                            <p className="text-sm font-medium text-primary">Análise Técnica:</p>
                            <p className="text-sm mt-1">{custom.engineering_notes}</p>
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2">
                          {custom.additional_cost > 0 && (
                            <div>
                              <p className="text-sm text-muted-foreground">Custo adicional</p>
                              <p className="font-semibold text-lg text-primary">
                                +{formatCurrency(custom.additional_cost)}
                              </p>
                            </div>
                          )}
                          {custom.delivery_impact_days > 0 && (
                            <div className="text-right">
                              <p className="text-sm text-muted-foreground">Impacto no prazo</p>
                              <p className="font-semibold">
                                +{custom.delivery_impact_days} dias
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {custom.status === 'rejected' && custom.engineering_notes && (
                      <div className="mt-3 p-3 bg-destructive/5 rounded border border-destructive/20">
                        <p className="text-sm font-medium text-destructive">Motivo:</p>
                        <p className="text-sm mt-1">{custom.engineering_notes}</p>
                      </div>
                    )}
                  </div>
                ))}
                
                {quotation.total_customizations_price > 0 && (
                  <>
                    <Separator />
                    <div className="flex justify-between items-center font-semibold text-lg pt-2">
                      <span>Total de Customizações</span>
                      <span className="text-primary">{formatCurrency(quotation.total_customizations_price)}</span>
                    </div>
                  </>
                )}
              </AccordionContent>
            </AccordionItem>
          )}

          {/* Resumo Financeiro */}
          <AccordionItem value="financial" className="border rounded-lg px-6 bg-card">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-primary" />
                </div>
                <span className="font-semibold">Resumo Financeiro Detalhado</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-4 space-y-4">
              <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
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
                
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Preço Base Final</span>
                  <span>{formatCurrency(quotation.final_base_price)}</span>
                </div>
              </div>

              {quotation.quotation_options && quotation.quotation_options.length > 0 && (
                <>
                  <div className="space-y-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total de Opcionais</span>
                      <span className="font-medium">{formatCurrency(quotation.total_options_price || 0)}</span>
                    </div>
                    
                    {quotation.options_discount_percentage > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Desconto sobre Opcionais ({quotation.options_discount_percentage}%)</span>
                        <span className="font-medium">
                          -{formatCurrency((quotation.total_options_price || 0) * (quotation.options_discount_percentage / 100))}
                        </span>
                      </div>
                    )}
                    
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Opcionais Final</span>
                      <span>{formatCurrency(quotation.final_options_price || 0)}</span>
                    </div>
                  </div>
                </>
              )}

              {quotation.total_customizations_price > 0 && (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Customizações Aprovadas</span>
                    <span>+{formatCurrency(quotation.total_customizations_price)}</span>
                  </div>
                </div>
              )}

              <Separator className="my-4" />

              <div className="flex justify-between text-2xl font-bold">
                <span>Valor Total</span>
                <span className="text-primary">{formatCurrency(quotation.final_price)}</span>
              </div>

              <div className="flex justify-between text-lg font-semibold mt-4 p-4 bg-accent/10 rounded-lg">
                <span>Prazo de Entrega</span>
                <span className="text-accent-foreground">{formatDays(quotation.total_delivery_days)}</span>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Footer */}
        <Card className="bg-muted/30">
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            <p>Esta proposta é válida até {format(new Date(quotation.valid_until), "dd/MM/yyyy")}.</p>
            <p className="mt-2">
              Para mais informações, entre em contato com {quotation.users?.full_name} através do email{" "}
              <a href={`mailto:${quotation.users?.email}`} className="text-primary hover:underline">
                {quotation.users?.email}
              </a>
            </p>
            <Separator className="my-4" />
            <p className="text-xs">OKEAN Yachts - Excelência em iates de luxo</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
