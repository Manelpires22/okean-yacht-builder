import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Link2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedSpecs {
  brand?: string;
  model?: string;
  description?: string;
  specifications: Record<string, number | string>;
}

interface SpecsUrlExtractorProps {
  onDataExtracted: (data: ExtractedSpecs) => void;
  className?: string;
}

export function SpecsUrlExtractor({ 
  onDataExtracted, 
  className 
}: SpecsUrlExtractorProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error("Digite uma URL válida");
      return;
    }

    setIsLoading(true);
    setLastExtraction(null);

    try {
      const { data, error } = await supabase.functions.invoke('extract-from-url', {
        body: { url: url.trim(), mode: 'specs' }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao extrair dados');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na extração');
      }

      const extractedData = data.data;
      const specsCount = Object.values(extractedData.specifications || {})
        .filter(v => v !== null && v !== undefined).length;
      
      onDataExtracted({
        brand: extractedData.brand,
        model: extractedData.model,
        description: extractedData.description,
        specifications: extractedData.specifications || {},
      });

      setLastExtraction({
        success: true,
        message: `${specsCount} especificações técnicas encontradas`
      });

      toast.success("Especificações extraídas!", {
        description: `${specsCount} campos técnicos preenchidos`
      });

    } catch (error) {
      console.error('Error extracting specs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setLastExtraction({
        success: false,
        message: errorMessage
      });

      toast.error("Erro ao extrair especificações", {
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Extrair Especificações Técnicas</span>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="https://fabricante.com/modelo"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleExtract();
                  }
                }}
              />
            </div>
            <Button 
              onClick={handleExtract} 
              disabled={isLoading || !url.trim()}
              variant="secondary"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Extraindo...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Extrair
                </>
              )}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">
            Extrai dimensões, capacidades, performance e outras especificações técnicas
          </p>

          {lastExtraction && (
            <div className={`flex items-center gap-2 text-sm ${
              lastExtraction.success ? 'text-green-600 dark:text-green-400' : 'text-destructive'
            }`}>
              {lastExtraction.success ? (
                <Check className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{lastExtraction.message}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
