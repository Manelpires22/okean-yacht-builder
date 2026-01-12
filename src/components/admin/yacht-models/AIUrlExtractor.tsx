import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Sparkles, Link2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExtractedBasicData {
  brand: string | null;
  model: string | null;
  description: string | null;
  exteriorImages: string[];
  interiorImages: string[];
}

interface AIUrlExtractorProps {
  onDataExtracted: (data: ExtractedBasicData) => void;
  className?: string;
}

export function AIUrlExtractor({ 
  onDataExtracted, 
  className 
}: AIUrlExtractorProps) {
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
        body: { url: url.trim(), mode: 'basic' }
      });

      if (error) {
        throw new Error(error.message || 'Erro ao extrair dados');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Falha na extração');
      }

      const extractedData = data.data;
      
      // Count extracted fields
      let fieldsCount = 0;
      if (extractedData.brand) fieldsCount++;
      if (extractedData.model) fieldsCount++;
      if (extractedData.description) fieldsCount++;
      
      const exteriorCount = extractedData.exteriorImages?.length || 0;
      const interiorCount = extractedData.interiorImages?.length || 0;
      
      onDataExtracted({
        brand: extractedData.brand || null,
        model: extractedData.model || null,
        description: extractedData.description || null,
        exteriorImages: extractedData.exteriorImages || [],
        interiorImages: extractedData.interiorImages || [],
      });

      setLastExtraction({
        success: true,
        message: `${fieldsCount} campos, ${exteriorCount} fotos externas, ${interiorCount} fotos internas`
      });

      toast.success("Dados extraídos com sucesso!", {
        description: `${fieldsCount} campos, ${exteriorCount} fotos externas, ${interiorCount} fotos internas`
      });

    } catch (error) {
      console.error('Error extracting data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      
      setLastExtraction({
        success: false,
        message: errorMessage
      });

      toast.error("Erro ao extrair dados", {
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
            <span>Preencher com IA</span>
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
            Extrai: Marca, Modelo, Descrição e fotos encontradas na página
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
