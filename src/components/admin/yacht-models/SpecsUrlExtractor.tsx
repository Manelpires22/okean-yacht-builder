import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, Sparkles, Link2, Check, AlertCircle, AlertTriangle, Search, ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ValidationIssue {
  field: string;
  currentValue: number | string;
  issue: string;
  suggestion?: number | string;
  severity: 'warning' | 'error';
}

interface ExtractedSpecs {
  brand?: string;
  model?: string;
  description?: string;
  specifications: Record<string, number | string>;
  validationIssues?: ValidationIssue[];
  missingFields?: string[];
}

interface SpecsUrlExtractorProps {
  onDataExtracted: (data: ExtractedSpecs) => void;
  onApplySuggestion?: (field: string, value: number | string) => void;
  className?: string;
}

const FIELD_LABELS: Record<string, string> = {
  length_overall: 'Comprimento Total',
  hull_length: 'Comprimento do Casco',
  beam: 'Boca Máxima',
  draft: 'Calado',
  height_from_waterline: 'Altura da Linha d\'Água',
  displacement_light: 'Deslocamento Leve',
  displacement_loaded: 'Deslocamento Carregado',
  dry_weight: 'Peso Seco',
  fuel_capacity: 'Combustível',
  water_capacity: 'Água',
  passengers_capacity: 'Passageiros',
  cabins: 'Cabines',
  bathrooms: 'Banheiros',
  max_speed: 'Velocidade Máxima',
  cruise_speed: 'Velocidade Cruzeiro',
  range_nautical_miles: 'Autonomia',
};

export function SpecsUrlExtractor({ 
  onDataExtracted,
  onApplySuggestion,
  className 
}: SpecsUrlExtractorProps) {
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastExtraction, setLastExtraction] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showIssues, setShowIssues] = useState(true);
  const [searchingField, setSearchingField] = useState<string | null>(null);
  const [extractedBrand, setExtractedBrand] = useState<string | null>(null);
  const [extractedModel, setExtractedModel] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!url.trim()) {
      toast.error("Digite uma URL válida");
      return;
    }

    setIsLoading(true);
    setLastExtraction(null);
    setValidationIssues([]);
    setMissingFields([]);

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
      
      // Salvar marca/modelo para busca complementar
      setExtractedBrand(extractedData.brand);
      setExtractedModel(extractedData.model);
      
      // Capturar issues de validação
      if (extractedData.validationIssues && extractedData.validationIssues.length > 0) {
        setValidationIssues(extractedData.validationIssues);
        setShowIssues(true);
      }
      
      // Capturar campos faltantes
      if (extractedData.missingFields && extractedData.missingFields.length > 0) {
        setMissingFields(extractedData.missingFields);
      }
      
      onDataExtracted({
        brand: extractedData.brand,
        model: extractedData.model,
        description: extractedData.description,
        specifications: extractedData.specifications || {},
        validationIssues: extractedData.validationIssues,
        missingFields: extractedData.missingFields,
      });

      const issuesCount = extractedData.validationIssues?.length || 0;
      const missingCount = extractedData.missingFields?.length || 0;
      
      setLastExtraction({
        success: true,
        message: `${specsCount} especificações encontradas${issuesCount > 0 ? `, ${issuesCount} alerta(s)` : ''}${missingCount > 0 ? `, ${missingCount} campo(s) vazio(s)` : ''}`
      });

      if (issuesCount > 0) {
        toast.warning("Especificações extraídas com alertas", {
          description: `${issuesCount} valor(es) podem estar incorretos`
        });
      } else {
        toast.success("Especificações extraídas!", {
          description: `${specsCount} campos técnicos preenchidos`
        });
      }

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

  const handleApplySuggestion = (issue: ValidationIssue) => {
    if (issue.suggestion !== undefined && onApplySuggestion) {
      onApplySuggestion(issue.field, issue.suggestion);
      // Remover issue da lista
      setValidationIssues(prev => prev.filter(i => i.field !== issue.field));
      toast.success(`${FIELD_LABELS[issue.field] || issue.field} atualizado para ${issue.suggestion}`);
    }
  };

  const handleDismissIssue = (field: string) => {
    setValidationIssues(prev => prev.filter(i => i.field !== field));
  };

  const handleSearchGoogle = async (field: string) => {
    if (!extractedBrand || !extractedModel) {
      toast.error("Marca e modelo não identificados para busca");
      return;
    }

    setSearchingField(field);
    
    try {
      // Formatar query de busca
      const fieldLabel = FIELD_LABELS[field] || field;
      const query = `${extractedBrand} ${extractedModel} ${fieldLabel} especificações técnicas`;
      
      // Abrir busca no Google em nova aba (usuário faz a pesquisa manualmente)
      const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      window.open(googleUrl, '_blank');
      
      toast.info(`Busca aberta para: ${fieldLabel}`, {
        description: "Copie o valor encontrado e preencha manualmente"
      });
    } catch (error) {
      console.error('Error searching:', error);
      toast.error("Erro ao buscar");
    } finally {
      setSearchingField(null);
    }
  };

  const hasIssuesOrMissing = validationIssues.length > 0 || missingFields.length > 0;

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Sparkles className="h-4 w-4" />
            <span>Extrair Especificações Técnicas com IA</span>
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
            A IA extrai e valida especificações. Valores absurdos serão sinalizados para revisão.
          </p>

          {lastExtraction && (
            <div className={`flex items-center gap-2 text-sm ${
              lastExtraction.success 
                ? validationIssues.length > 0 
                  ? 'text-amber-600 dark:text-amber-400' 
                  : 'text-green-600 dark:text-green-400' 
                : 'text-destructive'
            }`}>
              {lastExtraction.success ? (
                validationIssues.length > 0 ? (
                  <AlertTriangle className="h-4 w-4" />
                ) : (
                  <Check className="h-4 w-4" />
                )
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <span>{lastExtraction.message}</span>
            </div>
          )}

          {/* Alertas de validação */}
          {hasIssuesOrMissing && (
            <Collapsible open={showIssues} onOpenChange={setShowIssues}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {validationIssues.length > 0 && `${validationIssues.length} alerta(s)`}
                    {validationIssues.length > 0 && missingFields.length > 0 && ' • '}
                    {missingFields.length > 0 && `${missingFields.length} campo(s) vazio(s)`}
                  </span>
                  {showIssues ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 pt-3">
                {/* Issues de validação */}
                {validationIssues.map((issue) => (
                  <Alert 
                    key={issue.field} 
                    variant={issue.severity === 'error' ? 'destructive' : 'default'}
                    className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      {FIELD_LABELS[issue.field] || issue.field}: {issue.currentValue}
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      {issue.issue}
                    </AlertDescription>
                    <div className="flex gap-2 mt-2">
                      {issue.suggestion !== undefined && (
                        <Button 
                          size="sm" 
                          variant="default"
                          className="h-7 text-xs"
                          onClick={() => handleApplySuggestion(issue)}
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Usar {issue.suggestion}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => handleDismissIssue(issue.field)}
                      >
                        Manter valor
                      </Button>
                    </div>
                  </Alert>
                ))}

                {/* Campos faltantes */}
                {missingFields.length > 0 && (
                  <Alert className="bg-muted/50">
                    <Search className="h-4 w-4" />
                    <AlertTitle className="text-sm font-medium">
                      Campos não encontrados
                    </AlertTitle>
                    <AlertDescription className="text-xs mt-1">
                      <div className="flex flex-wrap gap-2 mt-2">
                        {missingFields.map((field) => (
                          <Button
                            key={field}
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            disabled={searchingField === field}
                            onClick={() => handleSearchGoogle(field)}
                          >
                            {searchingField === field ? (
                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Search className="h-3 w-3 mr-1" />
                            )}
                            {FIELD_LABELS[field] || field}
                          </Button>
                        ))}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CollapsibleContent>
            </Collapsible>
          )}
        </div>
      </CardContent>
    </Card>
  );
}