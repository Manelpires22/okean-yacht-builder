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
import { Loader2, Sparkles, RefreshCw, AlertCircle, Check, X, ImageIcon } from "lucide-react";
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
  brand?: string;
  model?: string;
  suggestedImages: string[];
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
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [includeDescription, setIncludeDescription] = useState(true);
  const [includeBrand, setIncludeBrand] = useState(true);
  const [includeModel, setIncludeModel] = useState(true);
  const [includeImages, setIncludeImages] = useState(true);

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
      setEditedBrand(data.brand || currentBrand || "");
      setEditedModel(data.model || currentModel || "");
      setSelectedImages(data.suggestedImages || []);
      
      // Set checkboxes based on what was returned
      setIncludeBrand(!currentBrand && !!data.brand);
      setIncludeModel(!currentModel && !!data.model);
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
    if (includeImages && selectedImages.length > 0) {
      data.images = selectedImages;
    }

    onAccept(data);
  };

  const handleRetry = () => {
    enrichMutation.mutate();
  };

  const toggleImageSelection = (imageUrl: string) => {
    setSelectedImages(prev => 
      prev.includes(imageUrl)
        ? prev.filter(url => url !== imageUrl)
        : [...prev, imageUrl]
    );
  };

  const typeLabels = {
    optional: 'Opcional',
    upgrade: 'Upgrade',
    memorial: 'Item do Memorial'
  };

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
            <div className="flex gap-4">
              <Skeleton className="h-24 w-32" />
              <Skeleton className="h-24 w-32" />
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
        ) : enrichMutation.isSuccess ? (
          <div className="space-y-6 py-2">
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
            </div>

            {/* Brand (only show if not already set) */}
            {!currentBrand && editedBrand && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-brand"
                    checked={includeBrand}
                    onCheckedChange={(checked) => setIncludeBrand(!!checked)}
                  />
                  <Label htmlFor="include-brand" className="font-medium cursor-pointer">
                    🏷️ Marca Sugerida
                  </Label>
                </div>
                <Input
                  value={editedBrand}
                  onChange={(e) => setEditedBrand(e.target.value)}
                  disabled={!includeBrand}
                  className={!includeBrand ? "opacity-50" : ""}
                  placeholder="Marca sugerida..."
                />
              </div>
            )}

            {/* Model (only show if not already set) */}
            {!currentModel && editedModel && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-model"
                    checked={includeModel}
                    onCheckedChange={(checked) => setIncludeModel(!!checked)}
                  />
                  <Label htmlFor="include-model" className="font-medium cursor-pointer">
                    📦 Modelo Sugerido
                  </Label>
                </div>
                <Input
                  value={editedModel}
                  onChange={(e) => setEditedModel(e.target.value)}
                  disabled={!includeModel}
                  className={!includeModel ? "opacity-50" : ""}
                  placeholder="Modelo sugerido..."
                />
              </div>
            )}

            {/* Images */}
            {enrichMutation.data?.suggestedImages && enrichMutation.data.suggestedImages.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="include-images"
                    checked={includeImages}
                    onCheckedChange={(checked) => setIncludeImages(!!checked)}
                  />
                  <Label htmlFor="include-images" className="font-medium cursor-pointer">
                    🖼️ Imagens Sugeridas
                  </Label>
                </div>
                <div className={`flex gap-4 flex-wrap ${!includeImages ? "opacity-50 pointer-events-none" : ""}`}>
                  {enrichMutation.data.suggestedImages.map((imageUrl, index) => (
                    <div
                      key={index}
                      className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImages.includes(imageUrl)
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-muted hover:border-primary/50"
                      }`}
                      onClick={() => includeImages && toggleImageSelection(imageUrl)}
                    >
                      <img
                        src={imageUrl}
                        alt={`Sugestão ${index + 1}`}
                        className="w-32 h-24 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjgiIGhlaWdodD0iOTYiIGZpbGw9Im5vbmUiPjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iOTYiIGZpbGw9IiNmMWYxZjEiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZmlsbD0iIzk5OSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiPkltYWdlbTwvdGV4dD48L3N2Zz4=';
                        }}
                      />
                      {selectedImages.includes(imageUrl) && (
                        <div className="absolute top-1 right-1 bg-primary text-primary-foreground rounded-full p-1">
                          <Check className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Clique nas imagens para selecionar/deselecionar. As imagens são sugestões ilustrativas.
                </p>
              </div>
            )}
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
