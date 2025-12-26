import { PDFBlock, BlockType } from "@/types/pdf-builder";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";

interface PDFBlockConfigProps {
  block: PDFBlock | null;
  onUpdateConfig: (blockId: string, config: Record<string, unknown>) => void;
}

interface ConfigField {
  key: string;
  label: string;
  type: "switch" | "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
}

const BLOCK_CONFIG_FIELDS: Record<BlockType, ConfigField[]> = {
  header: [
    { key: "showLogo", label: "Mostrar Logo", type: "switch" },
    { key: "showCompanyInfo", label: "Mostrar Dados da Empresa", type: "switch" },
    { key: "showDate", label: "Mostrar Data", type: "switch" },
  ],
  buyer: [
    { key: "showCPF", label: "Mostrar CPF/CNPJ", type: "switch" },
    { key: "showPhone", label: "Mostrar Telefone", type: "switch" },
    { key: "showEmail", label: "Mostrar E-mail", type: "switch" },
    { key: "showCompany", label: "Mostrar Empresa", type: "switch" },
  ],
  boat: [
    { key: "showImage", label: "Mostrar Imagem", type: "switch" },
    { key: "showSpecs", label: "Mostrar Especificações", type: "switch" },
    { key: "showHullNumber", label: "Mostrar Número do Casco", type: "switch" },
  ],
  technical_panel: [
    { key: "showDimensions", label: "Mostrar Dimensões", type: "switch" },
    { key: "showCapacity", label: "Mostrar Capacidades", type: "switch" },
    { key: "showEngines", label: "Mostrar Motores", type: "switch" },
    {
      key: "layout",
      label: "Layout",
      type: "select",
      options: [
        { value: "grid", label: "Grade" },
        { value: "list", label: "Lista" },
      ],
    },
  ],
  memorial: [
    { key: "showPrices", label: "Mostrar Preços", type: "switch" },
    {
      key: "columns",
      label: "Colunas",
      type: "select",
      options: [
        { value: "1", label: "1 Coluna" },
        { value: "2", label: "2 Colunas" },
      ],
    },
    { key: "groupByCategory", label: "Agrupar por Categoria", type: "switch" },
  ],
  upgrades: [
    { key: "showPrices", label: "Mostrar Preços", type: "switch" },
    { key: "showDeliveryImpact", label: "Mostrar Impacto no Prazo", type: "switch" },
  ],
  options: [
    { key: "showPrices", label: "Mostrar Preços", type: "switch" },
    { key: "showQuantity", label: "Mostrar Quantidade", type: "switch" },
    { key: "showDeliveryImpact", label: "Mostrar Impacto no Prazo", type: "switch" },
    { key: "groupByCategory", label: "Agrupar por Categoria", type: "switch" },
  ],
  customizations: [
    { key: "showPrices", label: "Mostrar Preços", type: "switch" },
    { key: "showStatus", label: "Mostrar Status", type: "switch" },
  ],
  financial_summary: [
    { key: "showBasePrice", label: "Mostrar Preço Base", type: "switch" },
    { key: "showDiscounts", label: "Mostrar Descontos", type: "switch" },
    { key: "showOptionsTotal", label: "Mostrar Total de Opcionais", type: "switch" },
    { key: "showDeliveryDays", label: "Mostrar Prazo de Entrega", type: "switch" },
    { key: "paymentConditions", label: "Condições de Pagamento", type: "textarea" },
  ],
  signatures: [
    { key: "showSellerSignature", label: "Assinatura do Vendedor", type: "switch" },
    { key: "showBuyerSignature", label: "Assinatura do Comprador", type: "switch" },
    { key: "showWitness", label: "Testemunhas", type: "switch" },
  ],
  notes: [
    { key: "content", label: "Observações", type: "textarea" },
  ],
  text: [
    { key: "title", label: "Título (opcional)", type: "text" },
    { key: "content", label: "Conteúdo", type: "textarea" },
  ],
  image: [
    { key: "imageUrl", label: "URL da Imagem", type: "text" },
    { key: "caption", label: "Legenda (opcional)", type: "text" },
    {
      key: "alignment",
      label: "Alinhamento",
      type: "select",
      options: [
        { value: "left", label: "Esquerda" },
        { value: "center", label: "Centro" },
        { value: "right", label: "Direita" },
      ],
    },
  ],
  page_break: [],
};

export function PDFBlockConfig({ block, onUpdateConfig }: PDFBlockConfigProps) {
  if (!block) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b">
          <h3 className="font-semibold text-sm">Propriedades</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4">
          <Settings className="h-12 w-12 mb-4 opacity-50" />
          <p className="text-sm font-medium text-center">Nenhum bloco selecionado</p>
          <p className="text-xs mt-1 text-center">
            Clique em um bloco para editar suas propriedades
          </p>
        </div>
      </div>
    );
  }

  const fields = BLOCK_CONFIG_FIELDS[block.type] || [];

  const handleConfigChange = (key: string, value: unknown) => {
    onUpdateConfig(block.id, { ...block.config, [key]: value });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Propriedades</h3>
        <p className="text-xs text-muted-foreground mt-1">{block.label}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {fields.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Este bloco não possui configurações.
            </p>
          ) : (
            fields.map((field) => (
              <div key={field.key} className="space-y-2">
                <Label htmlFor={field.key} className="text-sm">
                  {field.label}
                </Label>

                {field.type === "switch" && (
                  <div className="flex items-center">
                    <Switch
                      id={field.key}
                      checked={Boolean(block.config[field.key] ?? true)}
                      onCheckedChange={(checked) =>
                        handleConfigChange(field.key, checked)
                      }
                    />
                  </div>
                )}

                {field.type === "text" && (
                  <Input
                    id={field.key}
                    value={String(block.config[field.key] ?? "")}
                    onChange={(e) =>
                      handleConfigChange(field.key, e.target.value)
                    }
                    placeholder={field.label}
                  />
                )}

                {field.type === "textarea" && (
                  <Textarea
                    id={field.key}
                    value={String(block.config[field.key] ?? "")}
                    onChange={(e) =>
                      handleConfigChange(field.key, e.target.value)
                    }
                    placeholder={field.label}
                    rows={4}
                  />
                )}

                {field.type === "select" && field.options && (
                  <Select
                    value={String(block.config[field.key] ?? field.options[0]?.value ?? "")}
                    onValueChange={(value) =>
                      handleConfigChange(field.key, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
