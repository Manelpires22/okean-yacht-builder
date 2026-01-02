import { 
  Euro, 
  Ship, 
  User,
  Package, 
  Receipt,
  Globe,
  Home
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { ExchangeRateCard } from "./ExchangeRateCard";
import { SimulatorState } from "@/hooks/useSimulatorState";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface SimulatorSidebarProps {
  state: SimulatorState;
  onUpdateField: <K extends keyof SimulatorState>(field: K, value: SimulatorState[K]) => void;
}

export function SimulatorSidebar({ state, onUpdateField }: SimulatorSidebarProps) {
  return (
    <Sidebar className="border-r">
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Parâmetros</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>
      
      <SidebarContent className="p-2">
        {/* Vendedor Section (Read-only) */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Vendedor</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="pt-2">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="font-medium text-sm">{state.selectedCommissionName}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {state.selectedCommissionType === "venda_interna" ? "Interno" : 
                       state.selectedCommissionType === "broker_interno" ? "Broker" : "Sub-Dealer"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {state.selectedCommissionPercent}% comissão
                    </span>
                  </div>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Modelo Section (Read-only) */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <span>Modelo</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="pt-2">
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="font-mono text-xs text-muted-foreground">{state.selectedModelCode}</p>
                  <p className="font-medium text-sm">{state.selectedModelName}</p>
                  <Badge variant={state.isExportable ? "secondary" : "outline"} className="mt-2">
                    {state.isExportable ? (
                      <><Globe className="h-3 w-3 mr-1" /> Exportação</>
                    ) : (
                      <><Home className="h-3 w-3 mr-1" /> Nacional</>
                    )}
                  </Badge>
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Câmbio Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <span>Câmbio</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-3 pt-2">
                <ExchangeRateCard 
                  currency="EUR"
                  currentRate={state.eurRate}
                  onRateChange={(rate) => onUpdateField("eurRate", rate)}
                  compact
                />
                <ExchangeRateCard 
                  currency="USD"
                  currentRate={state.usdRate}
                  onRateChange={(rate) => onUpdateField("usdRate", rate)}
                  compact
                />
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Custos Base Section */}
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span>Custos Base</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">MP Importada ({state.custoMpImportCurrency})</Label>
                  <Input 
                    type="number"
                    value={state.custoMpImport || ""}
                    onChange={(e) => onUpdateField("custoMpImport", Number(e.target.value))}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Imposto Importação (%)</Label>
                  <Input 
                    type="number"
                    value={state.taxImportPercent || ""}
                    onChange={(e) => onUpdateField("taxImportPercent", Number(e.target.value))}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">MP Nacional (R$)</Label>
                  <Input 
                    type="number"
                    value={state.custoMpNacional || ""}
                    onChange={(e) => onUpdateField("custoMpNacional", Number(e.target.value))}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Horas de mão de obra</Label>
                  <Input 
                    type="number"
                    value={state.custoMoHoras || ""}
                    onChange={(e) => onUpdateField("custoMoHoras", Number(e.target.value))}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Custo/hora (R$)</Label>
                  <Input 
                    type="number"
                    value={state.custoMoValorHora || ""}
                    onChange={(e) => onUpdateField("custoMoValorHora", Number(e.target.value))}
                    placeholder="55,00"
                    className="h-8"
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Taxas Section */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-muted-foreground" />
                  <span>Taxas</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    Imposto Venda (%)
                    <span className="text-muted-foreground ml-1">
                      {state.isExportable ? "(Export)" : "(Nacional)"}
                    </span>
                  </Label>
                  <Input 
                    type="number"
                    value={state.salesTaxPercent || ""}
                    onChange={(e) => onUpdateField("salesTaxPercent", Number(e.target.value))}
                    placeholder={state.isExportable ? "0" : "21"}
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Garantia (%)</Label>
                  <Input 
                    type="number"
                    value={state.warrantyPercent || ""}
                    onChange={(e) => onUpdateField("warrantyPercent", Number(e.target.value))}
                    placeholder={state.isExportable ? "5" : "3"}
                    className="h-8"
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Trade-In Rules Section */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Ship className="h-4 w-4 text-muted-foreground" />
                  <span>Trade-In</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Custo Operação (%)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={state.tradeInOperationCostPercent || ""}
                    onChange={(e) => onUpdateField("tradeInOperationCostPercent", Number(e.target.value))}
                    placeholder="3"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comissão Usado (%)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={state.tradeInCommissionPercent || ""}
                    onChange={(e) => onUpdateField("tradeInCommissionPercent", Number(e.target.value))}
                    placeholder="5"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Redução Comissão Vendedor (%)</Label>
                  <Input 
                    type="number"
                    step="0.1"
                    value={state.tradeInCommissionReduction || ""}
                    onChange={(e) => onUpdateField("tradeInCommissionReduction", Number(e.target.value))}
                    placeholder="0.5"
                    className="h-8"
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
