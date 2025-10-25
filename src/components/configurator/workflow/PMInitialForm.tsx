import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdvanceCustomizationWorkflow, type CustomizationWorkflow } from "@/hooks/useCustomizationWorkflow";
import { ArrowRight, Plus, Trash2 } from "lucide-react";

interface PMInitialFormProps {
  customization: CustomizationWorkflow;
}

export function PMInitialForm({ customization }: PMInitialFormProps) {
  const [pmScope, setPmScope] = useState(customization.pm_scope || "");
  const [engineeringHours, setEngineeringHours] = useState(customization.engineering_hours || 0);
  const [requiredParts, setRequiredParts] = useState<string[]>(customization.required_parts || []);
  const [newPart, setNewPart] = useState("");

  const { mutate: advance, isPending } = useAdvanceCustomizationWorkflow();

  const handleAddPart = () => {
    if (newPart.trim()) {
      setRequiredParts([...requiredParts, newPart.trim()]);
      setNewPart("");
    }
  };

  const handleRemovePart = (index: number) => {
    setRequiredParts(requiredParts.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!pmScope || engineeringHours < 0) {
      return;
    }

    advance({
      customizationId: customization.id,
      currentStep: 'pm_initial',
      action: 'advance',
      data: {
        pm_scope: pmScope,
        engineering_hours: engineeringHours,
        required_parts: requiredParts,
      },
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>PM Inicial: Definir Escopo Técnico</CardTitle>
        <CardDescription>
          Defina o escopo técnico e o esforço de engenharia. Isso alimenta Supply e Planejamento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pm-scope">Escopo Técnico *</Label>
          <Textarea
            id="pm-scope"
            placeholder="Descreva em detalhes o escopo técnico da customização..."
            value={pmScope}
            onChange={(e) => setPmScope(e.target.value)}
            rows={6}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Exemplo: Integração elétrica, reforço estrutural na casa de máquinas, instalação de novos sistemas.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="engineering-hours">Horas de Engenharia *</Label>
          <Input
            id="engineering-hours"
            type="number"
            min="0"
            step="0.5"
            value={engineeringHours}
            onChange={(e) => setEngineeringHours(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <Label>Peças Preliminares</Label>
          <div className="flex gap-2">
            <Input
              placeholder="Nome da peça/componente"
              value={newPart}
              onChange={(e) => setNewPart(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPart())}
            />
            <Button type="button" onClick={handleAddPart} size="icon">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {requiredParts.length > 0 && (
            <div className="space-y-1 mt-2">
              {requiredParts.map((part, index) => (
                <div key={index} className="flex items-center justify-between bg-muted p-2 rounded">
                  <span className="text-sm">{part}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemovePart(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleSubmit}
          disabled={isPending || !pmScope || engineeringHours < 0}
          className="w-full"
        >
          {isPending ? "Processando..." : (
            <>
              Encaminhar para Supply <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
