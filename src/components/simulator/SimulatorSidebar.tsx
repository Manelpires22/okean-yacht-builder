import { 
  Euro, 
  DollarSign, 
  Ship, 
  Package, 
  Receipt, 
  Users, 
  RefreshCw 
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

        {/* Modelo Section */}
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
                <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  Seletor de modelo (em breve)
                </div>
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
                  <Label className="text-xs">Matéria-prima (R$)</Label>
                  <Input 
                    type="number"
                    value={state.materialCost || ""}
                    onChange={(e) => onUpdateField("materialCost", Number(e.target.value))}
                    placeholder="0,00"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Horas de mão de obra</Label>
                  <Input 
                    type="number"
                    value={state.laborHours || ""}
                    onChange={(e) => onUpdateField("laborHours", Number(e.target.value))}
                    placeholder="0"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Custo/hora (R$)</Label>
                  <Input 
                    type="number"
                    value={state.laborCostPerHour || ""}
                    onChange={(e) => onUpdateField("laborCostPerHour", Number(e.target.value))}
                    placeholder="150,00"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Custos fixos (R$)</Label>
                  <Input 
                    type="number"
                    value={state.fixedCosts || ""}
                    onChange={(e) => onUpdateField("fixedCosts", Number(e.target.value))}
                    placeholder="0,00"
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
                  <Label className="text-xs">Impostos (%)</Label>
                  <Input 
                    type="number"
                    value={state.taxPercent || ""}
                    onChange={(e) => onUpdateField("taxPercent", Number(e.target.value))}
                    placeholder="21"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Frete (%)</Label>
                  <Input 
                    type="number"
                    value={state.freightPercent || ""}
                    onChange={(e) => onUpdateField("freightPercent", Number(e.target.value))}
                    placeholder="2"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Garantia (%)</Label>
                  <Input 
                    type="number"
                    value={state.warrantyPercent || ""}
                    onChange={(e) => onUpdateField("warrantyPercent", Number(e.target.value))}
                    placeholder="3"
                    className="h-8"
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Comissões Section */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>Comissões</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="space-y-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Royalties (%)</Label>
                  <Input 
                    type="number"
                    value={state.royaltiesPercent || ""}
                    onChange={(e) => onUpdateField("royaltiesPercent", Number(e.target.value))}
                    placeholder="5"
                    className="h-8"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Comissão broker (%)</Label>
                  <Input 
                    type="number"
                    value={state.brokerCommissionPercent || ""}
                    onChange={(e) => onUpdateField("brokerCommissionPercent", Number(e.target.value))}
                    placeholder="3"
                    className="h-8"
                  />
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>

        {/* Trade-in Section */}
        <Collapsible className="group/collapsible">
          <SidebarGroup>
            <CollapsibleTrigger className="w-full">
              <SidebarGroupLabel className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded-md px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <span>Trade-in</span>
                </div>
                <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
              </SidebarGroupLabel>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent className="pt-2">
                <div className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
                  Em breve
                </div>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}
