import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, RefreshCw, AlertCircle, Check, X, AlertTriangle, ShieldCheck, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { EnrichmentData } from "./AIEnrichmentButton";

interface AIEnrichmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemName: string;
  itemType: 'optional' | 'upgrade' | 'memorial';
  currentBrand?: string;
  currentModel?: string;
  onAccept: (data: EnrichmentData) => void;
}

interface EnrichmentResult {
  description: string;
  extracted_brand: string | null;
  extracted_model: string | null;
  brand_confidence: number;
  needs_human_review: boolean;
  reasoning: string;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  if (confidence >= 0.9) {
    return (
      <Badge variant="default" className="bg-success text-success-foreground gap-1">
        <ShieldCheck className="h-3 w-3" />
        Alta confiança ({Math.round(confidence * 100)}%)
      </Badge>
    );
  }
  if (confidence >= 0.7) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Info className="h-3 w-3" />
        Média confiança ({Math.round(confidence * 100)}%)
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <AlertTriangle className="h-3 w-3" />
      Baixa confiança ({Math.round(confidence * 100)}%)
    </Badge>
  );
}

export function AIEnrichmentModal({
  open,
  onOpenChange,
  itemName,
  itemType,
  currentBrand,
  currentModel,
  onAccept,
}: AIEnrichmentModalProps) {
  const [editedDescription, setEditedDescription] = useState("");
  const [editedBrand, setEditedBrand] = useState("");
  const [editedModel, setEditedModel] = useState("");
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(true);
  const [includeModel, setIncludeModel] = useState(true);

  const enrichMutation = useMutation({
    mutationFn: async (): Promise<EnrichmentResult> => {
      const { data, error } = await supabase.functions.invoke('enrich-item-with-ai', {
        body: {
          name: itemName,
          type: itemType,
          brand: currentBrand,
          model: currentModel,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);
      
      return data;
    },
    onSuccess: (data) => {
      setEditedDescription(data.description || "");
      setEditedBrand(data.extracted_brand || currentBrand || "");
      setEditedModel(data.extracted_model || currentModel || "");
      
      // Set checkboxes based on what was returned and confidence
      setIncludeBrand(!currentBrand && !!data.extracted_brand && data.brand_confidence >= 0.7);
      setIncludeModel(!currentModel && !!data.extracted_model && data.brand_confidence >= 0.7);
    },
  });

  // Trigger enrichment when modal opens
  useEffect(() => {
    if (open && itemName) {
      enrichMutation.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, itemName]);

  const handleAccept = () => {
    const data: EnrichmentData = {};
    
    if (includeDescription && editedDescription) {
      data.description = editedDescription;
    }
    if (includeBrand && editedBrand && !currentBrand) {
      data.brand = editedBrand;
    }
    if (includeModel && editedModel && !currentModel) {
      data.model = editedModel;
    }

    onAccept(data);
  };

  const handleRetry = () => {
    enrichMutation.mutate();
  };

  const typeLabels = {
    optional: 'Opcional',
    upgrade: 'Upgrade',
    memorial: 'Item do Memorial'
  };

  const result = enrichMutation.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Enriquecimento com IA
          </DialogTitle>
          <DialogDescription>
            {typeLabels[itemType]}: <strong>{itemName}</strong>
          </DialogDescription>
        </DialogHeader>

        {enrichMutation.isPending ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Gerando conteúdo com IA...</span>
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ) : enrichMutation.isError ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Erro ao gerar conteúdo: {enrichMutation.error?.message || 'Erro desconhecido'}
              </span>
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        ) : enrichMutation.isSuccess && result ? (
          <div className="space-y-6 py-2">
            {/* Human Review Warning */}
            {result.needs_human_review && (
              <Alert variant="default" className="border-warning bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  <strong>Revisão recomendada:</strong> A IA não conseguiu identificar com certeza alguns dados. 
                  Verifique antes de aceitar.
                </AlertDescription>
              </Alert>
            )}

            {/* Confidence & Reasoning */}
            <div className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Confiança na identificação:</span>
                <ConfidenceBadge confidence={result.brand_confidence} />
              </div>
              <p className="text-sm text-muted-foreground">
                <strong>Raciocínio:</strong> {result.reasoning}
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="include-description"
                  checked={includeDescription}
                  onCheckedChange={(checked) => setIncludeDescription(!!checked)}
                />
                <Label htmlFor="include-description" className="font-medium cursor-pointer">
                  📝 Descrição Sugerida
                </Label>
              </div>
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={4}
                disabled={!includeDescription}
                className={!includeDescription ? "opacity-50" : ""}
                placeholder="Descrição gerada pela IA..."
              />
              <p className="text-xs text-muted-foreground">
                {editedDescription.length}/400 caracteres
              </p>
            </div>

            {/* Brand (only show if not already set and was extracted) */}
            {!currentBrand && result.extracted_brand && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-brand"
                    checked={includeBrand}
                    onCheckedChange={(checked) => setIncludeBrand(!!checked)}
                  />
                  <Label htmlFor="include-brand" className="font-medium cursor-pointer">
                    🏷️ Marca Identificada
                  </Label>
                  {result.brand_confidence < 0.7 && (
                    <Badge variant="outline" className="text-warning border-warning text-xs">
                      Verificar
                    </Badge>
                  )}
                </div>
                <Input
                  value={editedBrand}
                  onChange={(e) => setEditedBrand(e.target.value)}
                  disabled={!includeBrand}
                  className={!includeBrand ? "opacity-50" : ""}
                  placeholder="Marca identificada..."
                />
              </div>
            )}

            {/* Model (only show if not already set and was extracted) */}
            {!currentModel && result.extracted_model && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-model"
                    checked={includeModel}
                    onCheckedChange={(checked) => setIncludeModel(!!checked)}
                  />
                  <Label htmlFor="include-model" className="font-medium cursor-pointer">
                    📦 Modelo Identificado
                  </Label>
                  {result.brand_confidence < 0.7 && (
                    <Badge variant="outline" className="text-warning border-warning text-xs">
                      Verificar
                    </Badge>
                  )}
                </div>
                <Input
                  value={editedModel}
                  onChange={(e) => setEditedModel(e.target.value)}
                  disabled={!includeModel}
                  className={!includeModel ? "opacity-50" : ""}
                  placeholder="Modelo identificado..."
                />
              </div>
            )}

            {/* No Images Section - Removed per anti-hallucination policy */}
            <p className="text-xs text-muted-foreground italic">
              💡 Imagens devem ser adicionadas manualmente via upload para garantir autenticidade.
            </p>
          </div>
        ) : null}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          {enrichMutation.isSuccess && (
            <>
              <Button variant="outline" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Regenerar
              </Button>
              <Button onClick={handleAccept}>
                <Check className="h-4 w-4 mr-2" />
                Aceitar Selecionados
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
