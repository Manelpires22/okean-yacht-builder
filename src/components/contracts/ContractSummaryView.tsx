import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDays } from "@/lib/quotation-utils";
import { Calendar, Loader2, Info, FileText, ArrowUpCircle, Settings, DollarSign, FilePlus, User, Users, Download } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useContract, useLiveContract } from "@/hooks/useContracts";
import { useContractATOsAggregatedImpact } from "@/hooks/useContractATOsAggregatedImpact";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { MemorialDescritivoAccordion } from "@/components/quotations/MemorialDescritivoAccordion";
import { useMemorialItems } from "@/hooks/useMemorialItems";
import { useATOs } from "@/hooks/useATOs";
import { ExportContractPDFDialog } from "./ExportContractPDFDialog";

interface ContractSummaryViewProps {
  contractId: string;
}

export function ContractSummaryView({ contractId }: ContractSummaryViewProps) {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  const { data: contract, isLoading: isLoadingContract } = useContract(contractId);
  const { data: liveContract, isLoading: isLoadingLive } = useLiveContract(contractId);
  const { data: atosImpact, isLoading: isLoadingATOs } = useContractATOsAggregatedImpact(contractId);
  
  // Buscar memorial do modelo do iate
  const { data: memorialItems, isLoading: isLoadingMemorial } = useMemorialItems(
    contract?.yacht_model_id || ""
  );
  
  // Buscar ATOs do contrato
  const { data: atos, isLoading: isLoadingATOsList } = useATOs(contractId);
  const approvedATOs = atos?.filter(ato => ato.status === 'approved') || [];

  const isLoading = isLoadingContract || isLoadingLive || isLoadingATOs;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-80" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Contrato não encontrado</p>
      </div>
    );
  }

  const yachtModel = contract.yacht_model;
  const baseSnapshot = contract.base_snapshot as any;
  
  // Extrair arrays do snapshot
  const selectedOptions = baseSnapshot?.selected_options || [];
  const selectedUpgrades = baseSnapshot?.selected_upgrades || [];
  const customizations = baseSnapshot?.customizations || [];
  
  // Preço base do CONTRATO (com descontos já aplicados na assinatura)
  // Usar contract.base_price, não o preço do modelo do snapshot
  const contractBasePrice = contract.base_price || 0;
  
  // Preço base do MODELO (para referência no breakdown)
  const modelBasePrice = baseSnapshot?.base_price || yachtModel?.base_price || 0;
  
  // Calcular soma dos opcionais (ANTES do desconto)
  const optionsPrice = selectedOptions.reduce(
    (sum: number, opt: any) => sum + (opt.total_price || opt.unit_price || 0), 0
  );
  
  // Calcular soma dos upgrades (ANTES do desconto)
  const upgradesPrice = selectedUpgrades.reduce(
    (sum: number, upg: any) => sum + (upg.price || 0), 0
  );
  
  // Calcular soma das customizações
  const customizationsPrice = customizations.reduce(
    (sum: number, cust: any) => sum + (cust.pm_final_price || cust.additional_cost || 0), 0
  );
  
  // Percentuais de desconto
  const baseDiscountPercent = baseSnapshot?.discount_percentage || baseSnapshot?.base_discount_percentage || 0;
  const optionsDiscountPercent = baseSnapshot?.options_discount_percentage || 0;
  
  // Calcular desconto no barco base (usando preço do modelo)
  const baseDiscountAmount = modelBasePrice * (baseDiscountPercent / 100);
  
  // Calcular desconto nos opcionais/upgrades
  const optionsDiscountAmount = (optionsPrice + upgradesPrice) * (optionsDiscountPercent / 100);
  
  // Total de descontos
  const totalDiscount = baseDiscountAmount + optionsDiscountAmount;
  
  // Valor Inicial (ANTES dos descontos) - usando preço do modelo
  const valorInicial = modelBasePrice + upgradesPrice + optionsPrice + customizationsPrice;
  
  // ATOs aprovadas
  const atosPrice = atosImpact?.totalApprovedATOsPrice || 0;
  const atosCount = atosImpact?.approvedATOsCount || 0;
  
  // Valor Final
  const finalPrice = liveContract?.current_total_price || contract.current_total_price || (valorInicial - totalDiscount + atosPrice);
  
  // Delivery
  const baseDeliveryDays = contract.base_delivery_days;
  const totalDeliveryDays = liveContract?.current_total_delivery_days || contract.current_total_delivery_days;
  const hullNumber = contract.hull_number?.hull_number;
  const baseEstimatedDeliveryDate = contract.hull_number?.estimated_delivery_date;
  
  // Calcular data de entrega AJUSTADA (considerando impacto das ATOs)
  const atosDeliveryDays = atosImpact?.maxApprovedATOsDeliveryDays || 0;
  const adjustedDeliveryDate = baseEstimatedDeliveryDate 
    ? addDays(new Date(baseEstimatedDeliveryDate), atosDeliveryDays)
    : null;

  return (
    <div className="space-y-6">
      {/* Título da Seção */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Resumo do Contrato
          </h1>
          <p className="text-muted-foreground mt-1">
            Configuração completa e valores da embarcação contratada
          </p>
        </div>
        <Button onClick={() => setExportDialogOpen(true)}>
          <Download className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <ExportContractPDFDialog
        contractId={contractId}
        contractNumber={contract.contract_number}
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        approvedATOs={approvedATOs}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Modelo do Iate */}
        <Card className="overflow-hidden">
          <div className="relative h-48 sm:h-56 md:h-64 bg-gradient-to-br from-primary/10 to-primary/5">
            {yachtModel?.image_url && (
              <img
                src={yachtModel.image_url}
                alt={yachtModel.name}
                className="w-full h-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white">
              <h3 className="text-2xl sm:text-3xl font-bold mb-2">{yachtModel?.name}</h3>
              {yachtModel?.code && (
                <p className="text-sm opacity-90">Código: {yachtModel.code}</p>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold">{yachtModel?.name}</h2>
                <p className="text-sm text-muted-foreground">Código: {yachtModel?.code}</p>
                {yachtModel?.description && (
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
                {adjustedDeliveryDate ? "Entrega Prevista" : "Prazo de Entrega"}
              </p>
              <p className="text-2xl font-bold">
                {adjustedDeliveryDate 
                  ? format(adjustedDeliveryDate, "dd/MM/yyyy", { locale: ptBR })
                  : formatDays(totalDeliveryDays)}
              </p>
              {hullNumber && (
                <p className="text-sm text-muted-foreground mt-1">
                  Matrícula: {hullNumber}
                </p>
              )}
              {atosDeliveryDays > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  (+{atosDeliveryDays} dias de impacto ATOs)
                </p>
              )}
            </div>

            {/* Breakdown Financeiro Simplificado */}
            <div className="pt-4 border-t space-y-3 text-sm">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Composição do Contrato
              </p>
              
              {/* Valor do Contrato Aprovado (FIXO - vem da cotação aceita) */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valor Contrato Aprovado</span>
                <span className="font-medium">{formatCurrency(contractBasePrice)}</span>
              </div>
              
              {/* Lista cada ATO individualmente com seu resultado líquido */}
              {atosImpact?.atoBreakdown?.map((ato) => {
                const netTotal = ato.netTotal ?? 0;
                return (
                  <div key={ato.atoId} className="flex justify-between">
                    <span className="text-muted-foreground truncate max-w-[200px]" title={ato.title}>
                      {ato.atoNumber}
                    </span>
                    <span className={`font-medium ${netTotal >= 0 ? 'text-amber-600' : 'text-green-600'}`}>
                      {netTotal >= 0 
                        ? `+${formatCurrency(netTotal)}` 
                        : `-${formatCurrency(Math.abs(netTotal))}`}
                    </span>
                  </div>
                );
              })}
              
              {/* Separador */}
              <Separator className="my-2" />
              
              {/* Valor Total Atual */}
              <div className="flex justify-between pt-1">
                <span className="font-semibold text-base">Valor Total Atual</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(contractBasePrice + (atosImpact?.totalApprovedATOsPrice || 0))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accordions de Detalhes */}
      <Accordion type="multiple" defaultValue={["info"]} className="space-y-4">
        {/* 1. Informações Gerais */}
        <AccordionItem value="info" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Informações Gerais</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cliente */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Cliente</span>
                </div>
                <p className="font-semibold">{contract.client?.name || "—"}</p>
                {contract.client?.email && (
                  <p className="text-sm text-muted-foreground">{contract.client.email}</p>
                )}
                {contract.client?.phone && (
                  <p className="text-sm text-muted-foreground">{contract.client.phone}</p>
                )}
              </div>

              {/* Vendedor */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Vendedor</span>
                </div>
                <p className="font-semibold">
                  {contract.quotation?.sales_representative?.full_name || baseSnapshot?.seller?.full_name || baseSnapshot?.seller_name || "—"}
                </p>
                {(contract.quotation?.sales_representative?.email || baseSnapshot?.seller?.email || baseSnapshot?.seller_email) && (
                  <p className="text-sm text-muted-foreground">
                    {contract.quotation?.sales_representative?.email || baseSnapshot?.seller?.email || baseSnapshot?.seller_email}
                  </p>
                )}
              </div>

              {/* Datas */}
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Datas</span>
                </div>
                <div className="space-y-1">
                  {contract.signed_at && (
                    <p className="text-sm">
                      <span className="text-muted-foreground">Assinado: </span>
                      <span className="font-medium">
                        {format(new Date(contract.signed_at), "dd/MM/yyyy", { locale: ptBR })}
                      </span>
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="text-muted-foreground">Criado: </span>
                    <span className="font-medium">
                      {format(new Date(contract.created_at || ""), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* 2. Memorial Descritivo */}
        <AccordionItem value="memorial" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Memorial Descritivo</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {memorialItems?.length || 0} itens
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {isLoadingMemorial ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : memorialItems && memorialItems.length > 0 ? (
              <MemorialDescritivoAccordion items={memorialItems} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum item no memorial</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 3. Upgrades Selecionados */}
        <AccordionItem value="upgrades" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <ArrowUpCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Upgrades Selecionados</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {selectedUpgrades.length} itens
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {selectedUpgrades.length > 0 ? (
              <div className="space-y-3">
                {selectedUpgrades.map((upgrade: any, index: number) => (
                  <div key={upgrade.id || index} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {upgrade.upgrade?.name || upgrade.upgrade_name || upgrade.name || 'Upgrade'}
                        </p>
                        {(upgrade.memorial_item?.item_name || upgrade.memorial_item_name) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Substitui: {upgrade.memorial_item?.item_name || upgrade.memorial_item_name}
                          </p>
                        )}
                        {(upgrade.upgrade?.code || upgrade.code) && (
                          <Badge variant="outline" className="mt-2 text-xs">
                            {upgrade.upgrade?.code || upgrade.code}
                          </Badge>
                        )}
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-primary">
                          {formatCurrency(upgrade.price || 0)}
                        </p>
                        {upgrade.delivery_days_impact > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{upgrade.delivery_days_impact} dias
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold">Total Upgrades</span>
                  <span className="font-bold text-primary">{formatCurrency(upgradesPrice)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ArrowUpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum upgrade selecionado</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 4. Opcionais Selecionados */}
        <AccordionItem value="options" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Settings className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Opcionais Selecionados</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {selectedOptions.length} itens
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {selectedOptions.length > 0 ? (
              <div className="space-y-3">
                {selectedOptions.map((option: any, index: number) => (
                  <div key={option.id || index} className="p-4 border rounded-lg bg-muted/30">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">
                          {option.option?.name || option.option_name || option.name || 'Opcional'}
                        </p>
                        {(option.option?.category?.name || option.category_name) && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {option.option?.category?.name || option.category_name}
                          </p>
                        )}
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {(option.option?.code || option.code) && (
                            <Badge variant="outline" className="text-xs">
                              {option.option?.code || option.code}
                            </Badge>
                          )}
                          {option.quantity > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              Qtd: {option.quantity}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-primary">
                          {formatCurrency(option.total_price || option.unit_price || 0)}
                        </p>
                        {option.delivery_days_impact > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            +{option.delivery_days_impact} dias
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold">Total Opcionais</span>
                  <span className="font-bold text-primary">{formatCurrency(optionsPrice)}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum opcional selecionado</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 5. ATOs Aprovadas */}
        <AccordionItem value="atos" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <FilePlus className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">ATOs Aprovadas</span>
              <Badge variant="secondary" className="ml-auto mr-4">
                {approvedATOs.length} ATOs
              </Badge>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            {isLoadingATOsList ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : approvedATOs.length > 0 ? (
              <div className="space-y-3">
                {approvedATOs.map((ato: any) => {
                  const breakdown = atosImpact?.atoBreakdown?.find((b) => b.atoId === ato.id);
                  const netTotal = breakdown?.netTotal ?? ato.price_impact ?? 0;
                  
                  return (
                    <Accordion type="single" collapsible key={ato.id}>
                      <AccordionItem value={ato.id} className="border rounded-lg bg-muted/30">
                        <AccordionTrigger className="px-4 hover:no-underline">
                          <div className="flex justify-between w-full pr-4">
                            <div className="text-left">
                              <p className="font-medium">{ato.title}</p>
                              <p className="text-sm text-muted-foreground">{ato.ato_number}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${netTotal >= 0 ? 'text-primary' : 'text-green-600'}`}>
                                {netTotal >= 0 
                                  ? formatCurrency(netTotal)
                                  : `-${formatCurrency(Math.abs(netTotal))}`}
                              </p>
                              {(breakdown?.deliveryDaysImpact || ato.delivery_days_impact) > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  +{breakdown?.deliveryDaysImpact || ato.delivery_days_impact} dias
                                </p>
                              )}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-4">
                          {breakdown?.items && breakdown.items.length > 0 ? (
                            <div className="space-y-2">
                              {breakdown.items.map((item, idx) => (
                                <div key={idx} className="p-3 border rounded-lg bg-background">
                                  <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm">{item.itemName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {item.itemType === 'upgrade' ? 'Upgrade' : 
                                         item.itemType === 'option' ? 'Opcional' : 'Customização'}
                                        {item.itemCode && ` • ${item.itemCode}`}
                                      </p>
                                    </div>
                                    <div className="text-right text-sm space-y-0.5">
                                      <p className="text-muted-foreground">
                                        Bruto: {formatCurrency(item.originalPrice)}
                                      </p>
                                      {item.discountAmount > 0 && (
                                        <p className="text-green-600 text-xs">
                                          Desconto: -{formatCurrency(item.discountAmount)}
                                        </p>
                                      )}
                                      {item.replacementCredit !== 0 && (
                                        <p className="text-green-600 text-xs">
                                          Crédito: {formatCurrency(item.replacementCredit)}
                                        </p>
                                      )}
                                      <p className={`font-semibold ${item.netPrice >= 0 ? '' : 'text-green-600'}`}>
                                        Líquido: {item.netPrice >= 0 
                                          ? formatCurrency(item.netPrice) 
                                          : `-${formatCurrency(Math.abs(item.netPrice))}`}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {ato.description || 'Sem detalhes disponíveis'}
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
                <Separator />
                <div className="flex justify-between items-center pt-2">
                  <span className="font-semibold">Total ATOs</span>
                  <span className={`font-bold ${atosPrice >= 0 ? 'text-primary' : 'text-green-600'}`}>
                    {atosPrice >= 0 ? formatCurrency(atosPrice) : `-${formatCurrency(Math.abs(atosPrice))}`}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <FilePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma ATO aprovada</p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 6. Detalhamento Financeiro */}
        <AccordionItem value="financial" className="border rounded-lg px-4 bg-card">
          <AccordionTrigger className="hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="font-semibold">Detalhamento Financeiro</span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-2 pb-4">
            <div className="space-y-3">
              
              {/* Bloco 1: Base */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Preço Base do Modelo</span>
                  <span className="font-medium">{formatCurrency(modelBasePrice)}</span>
                </div>
                
                {baseDiscountPercent > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Desconto sobre Base ({baseDiscountPercent}%)</span>
                    <span>-{formatCurrency(baseDiscountAmount)}</span>
                  </div>
                )}
                
                <div className="flex justify-between font-semibold">
                  <span>Preço Base Final</span>
                  <span>{formatCurrency(modelBasePrice - baseDiscountAmount)}</span>
                </div>
              </div>

              {/* Bloco 2: Opcionais */}
              {selectedOptions.length > 0 && (
                <div className="pt-3 border-t space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de Opcionais ({selectedOptions.length} itens)</span>
                    <span className="font-medium">{formatCurrency(optionsPrice)}</span>
                  </div>
                  
                  {optionsDiscountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto sobre Opcionais ({optionsDiscountPercent}%)</span>
                      <span>-{formatCurrency(optionsPrice * (optionsDiscountPercent / 100))}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold">
                    <span>Opcionais Final</span>
                    <span>{formatCurrency(optionsPrice - (optionsPrice * (optionsDiscountPercent / 100)))}</span>
                  </div>
                </div>
              )}

              {/* Bloco 3: Upgrades */}
              {selectedUpgrades.length > 0 && (
                <div className="pt-3 border-t space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total de Upgrades ({selectedUpgrades.length} itens)</span>
                    <span className="font-medium">{formatCurrency(upgradesPrice)}</span>
                  </div>
                  
                  {optionsDiscountPercent > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto sobre Upgrades ({optionsDiscountPercent}%)</span>
                      <span>-{formatCurrency(upgradesPrice * (optionsDiscountPercent / 100))}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between font-semibold">
                    <span>Upgrades Final</span>
                    <span>{formatCurrency(upgradesPrice - (upgradesPrice * (optionsDiscountPercent / 100)))}</span>
                  </div>
                </div>
              )}

              {/* Bloco 4: Customizações (se houver) */}
              {customizationsPrice > 0 && (
                <div className="pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Customizações ({customizations.length} itens)</span>
                    <span className="font-medium">{formatCurrency(customizationsPrice)}</span>
                  </div>
                </div>
              )}

              {/* Subtotal: Valor Contrato Assinado */}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Valor Contrato Assinado</span>
                  <span className="font-bold text-xl">{formatCurrency(contractBasePrice)}</span>
                </div>
              </div>

              {/* Bloco 5: ATOs Aprovadas (expansível com breakdown) */}
              {approvedATOs.length > 0 && (
                <div className="pt-4 border-t border-dashed space-y-3">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Alterações Pós-Contrato (ATOs)
                  </p>
                  
                  {atosImpact?.atoBreakdown?.map((ato) => {
                    const netTotal = ato.netTotal ?? 0;
                    return (
                      <Accordion type="single" collapsible key={ato.atoId}>
                        <AccordionItem value={ato.atoId} className="border-0 bg-muted/30 rounded-lg">
                          <AccordionTrigger className="px-3 py-2 hover:no-underline">
                            <div className="flex justify-between w-full pr-4">
                              <div className="text-left">
                                <p className="font-medium text-sm">{ato.atoNumber}</p>
                                <p className="text-xs text-muted-foreground">{ato.title}</p>
                              </div>
                              <span className={`font-semibold text-sm ${netTotal < 0 ? 'text-amber-600' : ''}`}>
                                {netTotal >= 0 ? `+${formatCurrency(netTotal)}` : `-${formatCurrency(Math.abs(netTotal))}`}
                              </span>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="px-3 pb-3 space-y-2">
                            {ato.items?.map((item, idx) => (
                              <div key={idx} className="p-2 bg-background rounded border border-border/50">
                                <div className="flex justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-medium text-sm truncate">{item.itemName}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {item.itemType === 'upgrade' ? 'Upgrade' : 
                                       item.itemType === 'option' ? 'Opcional' : 'Customização'}
                                      {item.itemCode && ` • ${item.itemCode}`}
                                    </p>
                                  </div>
                                  <div className="text-right text-xs space-y-0.5 flex-shrink-0">
                                    <p>Bruto: {formatCurrency(item.originalPrice)}</p>
                                    {item.discountAmount > 0 && (
                                      <p className="text-green-600">Desconto: -{formatCurrency(item.discountAmount)}</p>
                                    )}
                                    {item.replacementCredit !== 0 && (
                                      <p className="text-amber-600">Crédito: {formatCurrency(Math.abs(item.replacementCredit))}</p>
                                    )}
                                    <p className={`font-semibold ${item.netPrice < 0 ? 'text-amber-600' : ''}`}>
                                      Líquido: {item.netPrice >= 0 ? formatCurrency(item.netPrice) : `-${formatCurrency(Math.abs(item.netPrice))}`}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    );
                  })}
                  
                  {/* Total das ATOs */}
                  <div className={`flex justify-between font-semibold ${atosPrice < 0 ? 'text-amber-600' : ''}`}>
                    <span>Total Alterações ({atosCount} ATOs)</span>
                    <span>{atosPrice >= 0 ? `+${formatCurrency(atosPrice)}` : `-${formatCurrency(Math.abs(atosPrice))}`}</span>
                  </div>
                </div>
              )}

              {/* Valor Total Atual (destaque final) */}
              <div className="pt-3 border-t">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-lg">Valor Total Atual</span>
                  <span className="font-bold text-2xl text-primary">
                    {formatCurrency(contractBasePrice + atosPrice)}
                  </span>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
