import { useState } from "react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileUp, CheckCircle2, AlertCircle, Upload } from "lucide-react";
import { toast } from "sonner";

interface ImportDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDataExtracted: (data: any) => void;
}

export function ImportDocumentDialog({ 
  open, 
  onOpenChange, 
  onDataExtracted 
}: ImportDocumentDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Validar tipo de arquivo
      const validTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Formato não suportado. Use PDF, DOCX, XLSX ou TXT');
        return;
      }
      
      // Validar tamanho (máx 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 20MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Ler arquivo como texto
      const text = await file.text();

      console.log('Enviando documento para processamento...');
      console.log('Arquivo:', file.name, 'Tamanho:', file.size, 'bytes');

      // Chamar edge function para extrair dados
      const { data, error: functionError } = await supabase.functions.invoke('extract-yacht-specs', {
        body: { documentText: text }
      });

      if (functionError) {
        console.error('Erro ao chamar função:', functionError);
        
        // Mensagens específicas para erros comuns
        let errorMessage = functionError.message || 'Erro ao processar documento';
        
        if (errorMessage.includes('FunctionsHttpError: 402')) {
          errorMessage = '❌ Créditos de IA esgotados.\n\nAdicione fundos ao workspace Lovable:\nSettings > Workspace > Usage';
        } else if (errorMessage.includes('FunctionsHttpError: 429')) {
          errorMessage = '⏱️ Limite de requisições excedido.\n\nAguarde alguns instantes e tente novamente.';
        } else if (errorMessage.includes('token count exceeds')) {
          errorMessage = '📄 Documento muito grande.\n\nO arquivo excede o limite de tokens. Tente um documento menor.';
        }
        
        throw new Error(errorMessage);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.success) {
        throw new Error('Resposta inválida da função de extração');
      }

      console.log('Dados extraídos com sucesso:', data.data);
      setExtractedData(data.data);
      toast.success('Documento processado com sucesso!');

    } catch (err: any) {
      console.error('Erro ao processar documento:', err);
      setError(err.message || 'Erro ao processar documento');
      toast.error('Erro ao processar documento');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApply = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      onOpenChange(false);
      
      // Reset
      setFile(null);
      setExtractedData(null);
      setError(null);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFile(null);
    setExtractedData(null);
    setError(null);
  };

  const countFields = (obj: any): number => {
    if (!obj) return 0;
    return Object.values(obj).filter(v => v !== null && v !== undefined && v !== '').length;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileUp className="h-5 w-5" />
            Importar Dados do Documento
          </DialogTitle>
          <DialogDescription>
            Faça upload de um documento (PDF, Word, Excel) com especificações do iate. 
            A IA do Lovable (Gemini 2.5 Flash) irá extrair automaticamente os dados e preencher o formulário.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Upload Area */}
          <div className="space-y-2">
            <Label htmlFor="file-upload">Selecionar Documento</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.docx,.xlsx,.txt"
                onChange={handleFileChange}
                disabled={isProcessing}
              />
              {file && (
                <Badge variant="secondary" className="whitespace-nowrap">
                  {(file.size / 1024).toFixed(0)} KB
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Formatos: PDF, Word (.docx), Excel (.xlsx), TXT | Máximo: 20MB
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Processing State */}
          {isProcessing && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">Processando documento com IA do Lovable...</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Isso pode levar alguns segundos dependendo do tamanho do arquivo.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Preview of Extracted Data */}
          {extractedData && !isProcessing && (
            <Card className="border-success">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-success">
                  <CheckCircle2 className="h-5 w-5" />
                  Dados Extraídos com Sucesso
                </CardTitle>
                <CardDescription>
                  Revise os dados abaixo antes de aplicar ao formulário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Dados Básicos</p>
                    <p className="text-2xl font-bold">
                      {countFields(extractedData.basic_data)}
                    </p>
                    <p className="text-xs text-muted-foreground">campos encontrados</p>
                  </div>
                  
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Especificações</p>
                    <p className="text-2xl font-bold">
                      {countFields(extractedData.specifications)}
                    </p>
                    <p className="text-xs text-muted-foreground">campos encontrados</p>
                  </div>
                  
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Memorial Descritivo</p>
                    <p className="text-2xl font-bold">
                      {extractedData.memorial_items?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">itens identificados</p>
                  </div>
                  
                  <div className="p-3 bg-secondary rounded-lg">
                    <p className="text-sm text-muted-foreground">Opcionais</p>
                    <p className="text-2xl font-bold">
                      {extractedData.options?.length || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">itens encontrados</p>
                  </div>
                </div>

                {/* Key Fields Preview */}
                {extractedData.basic_data?.name && (
                  <Alert>
                    <AlertDescription>
                      <span className="font-medium">Modelo Detectado:</span>{' '}
                      {extractedData.basic_data.name}
                      {extractedData.basic_data.code && ` (${extractedData.basic_data.code})`}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!isProcessing && !extractedData && file && (
            <Button 
              onClick={handleProcess} 
              className="w-full"
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Processar com IA Lovable
            </Button>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          {extractedData && (
            <Button onClick={handleApply}>
              Aplicar ao Formulário
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
