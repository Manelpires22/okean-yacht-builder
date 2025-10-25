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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, FileUp, CheckCircle2, AlertCircle, Upload, Eye } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  const [forceCleanContext, setForceCleanContext] = useState(true); // Fase 5
  const [showConfirmDialog, setShowConfirmDialog] = useState(false); // Fase 4
  const [debugInfo, setDebugInfo] = useState<any>(null); // Fase 3
  const [documentPreview, setDocumentPreview] = useState<string>(''); // Fase 3

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Aceitar qualquer arquivo que o input permita
      // A validação real será feita durante o processamento
      console.log('📁 Arquivo selecionado:', selectedFile.name);
      console.log('📊 Tipo MIME:', selectedFile.type);
      console.log('📊 Tamanho:', selectedFile.size, 'bytes');
      
      // Validar tamanho (máx 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        setError('Arquivo muito grande. Máximo 20MB');
        return;
      }
      
      setFile(selectedFile);
      setError(null);
      setExtractedData(null);
      setDebugInfo(null);
      setDocumentPreview('');
    }
  };

  const handleProcess = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setDebugInfo(null);

    try {
      // FASE 1: Detectar tipo de arquivo e extrair texto corretamente
      let documentText = '';
      
      const isBinaryFile = file.type.includes('wordprocessingml') || 
                           file.type.includes('spreadsheetml') ||
                           file.type.includes('pdf');
      
      if (isBinaryFile) {
        console.log('📄 Arquivo binário detectado:', file.type);
        toast.info('Extraindo texto do documento binário...');
        
        // Fazer upload temporário para o storage
        const tempPath = `temp/${Date.now()}_${file.name}`;
        
        console.log('📤 Fazendo upload temporário...');
        const { error: uploadError } = await supabase.storage
          .from('yacht-images')
          .upload(tempPath, file, {
            cacheControl: '3600',
            upsert: false
          });
        
        if (uploadError) {
          console.error('Erro ao fazer upload:', uploadError);
          throw new Error('Erro ao fazer upload do arquivo: ' + uploadError.message);
        }

        // Obter URL pública temporária
        const { data: { publicUrl } } = supabase.storage
          .from('yacht-images')
          .getPublicUrl(tempPath);

        console.log('🔗 URL pública:', publicUrl);
        
        // Baixar arquivo como blob para ler localmente
        const response = await fetch(publicUrl);
        const blob = await response.blob();
        
        // Converter blob para ArrayBuffer
        const arrayBuffer = await blob.arrayBuffer();
        
        // Extrair texto básico (limitado)
        // Para DOCX e PDF, precisamos de parsing especializado
        // Por enquanto, vamos usar uma abordagem simples
        const uint8Array = new Uint8Array(arrayBuffer);
        const decoder = new TextDecoder('utf-8', { fatal: false });
        documentText = decoder.decode(uint8Array);
        
        // Limpar caracteres de controle e não imprimíveis
        documentText = documentText.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ' ');
        
        console.log('📝 Texto extraído (primeiros 500 chars):', documentText.substring(0, 500));
        
        // Deletar arquivo temporário
        console.log('🗑️ Removendo arquivo temporário...');
        await supabase.storage.from('yacht-images').remove([tempPath]);
        
        if (!documentText || documentText.trim().length < 50) {
          throw new Error('Não foi possível extrair texto suficiente do documento. Tente converter para PDF ou TXT primeiro.');
        }
      } else {
        // Arquivo texto simples
        console.log('📝 Arquivo de texto detectado');
        documentText = await file.text();
      }

      // Preview do documento (primeiros 500 caracteres) - Fase 3
      const preview = documentText.substring(0, 500);
      setDocumentPreview(preview);

      console.log('📤 Enviando documento para processamento...');
      console.log('📁 Arquivo:', file.name);
      console.log('📊 Tamanho do texto extraído:', documentText.length, 'caracteres');
      console.log('🔤 Preview:', preview.substring(0, 200) + '...');

      // FASE 2 & 5: Enviar com ID único e flag forceCleanContext
      const requestId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const { data, error: functionError } = await supabase.functions.invoke('extract-yacht-specs', {
        body: { 
          documentText,
          fileName: file.name,
          forceCleanContext,
          requestId
        }
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

      console.log('✅ Dados extraídos com sucesso:', data.data);
      
      // FASE 3: Armazenar debug info
      setDebugInfo({
        fileName: file.name,
        fileSize: file.size,
        preview: documentPreview.substring(0, 200),
        detectedCode: data.data?.basic_data?.code,
        detectedName: data.data?.basic_data?.name,
        requestId: data.requestId,
        rawResponse: data
      });
      
      setExtractedData(data.data);
      
      // FASE 4: Mostrar dialog de confirmação ao invés de aplicar direto
      setShowConfirmDialog(true);
      toast.success('Documento processado! Revise os dados antes de aplicar.');

    } catch (err: any) {
      console.error('Erro ao processar documento:', err);
      setError(err.message || 'Erro ao processar documento');
      toast.error('Erro ao processar documento');
    } finally {
      setIsProcessing(false);
    }
  };

  // FASE 4: Handler para aplicar dados após confirmação
  const handleConfirmApply = () => {
    if (extractedData) {
      onDataExtracted(extractedData);
      setShowConfirmDialog(false);
      onOpenChange(false);
      
      // Reset
      setFile(null);
      setExtractedData(null);
      setError(null);
      setDebugInfo(null);
      setDocumentPreview('');
      toast.success('Dados aplicados ao formulário!');
    }
  };

  const handleReprocess = () => {
    setShowConfirmDialog(false);
    setExtractedData(null);
    setDebugInfo(null);
    setDocumentPreview('');
    // Manter arquivo selecionado para reprocessar
    toast.info('Clique em "Processar" novamente para reprocessar o documento');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setFile(null);
    setExtractedData(null);
    setError(null);
    setDebugInfo(null);
    setDocumentPreview('');
    setShowConfirmDialog(false);
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
                accept=".pdf,.docx,.xlsx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
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
              ✅ Formatos aceitos: PDF, Word (.docx), Excel (.xlsx), TXT | Máximo: 20MB
            </p>
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-xs">
                <strong>Dica:</strong> Para melhor extração de texto, prefira arquivos TXT ou PDF com texto selecionável.
                Documentos escaneados (apenas imagens) podem ter resultados limitados.
              </AlertDescription>
            </Alert>
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

          {/* FASE 5: Opção de Forçar Contexto Limpo */}
          {file && !isProcessing && !extractedData && (
            <div className="flex items-center space-x-2 p-4 bg-secondary/50 rounded-lg">
              <Checkbox 
                id="force-clean"
                checked={forceCleanContext}
                onCheckedChange={(checked) => setForceCleanContext(checked as boolean)}
              />
              <Label htmlFor="force-clean" className="text-sm cursor-pointer">
                🔴 Forçar contexto limpo (recomendado para evitar mistura de dados)
              </Label>
            </div>
          )}

          {/* FASE 3: Debug Info (collapsible) */}
          {debugInfo && (
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes de Processamento
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2">
                  <CardContent className="pt-4 text-xs font-mono space-y-2">
                    <div><strong>Arquivo:</strong> {debugInfo.fileName}</div>
                    <div><strong>Tamanho:</strong> {debugInfo.fileSize} bytes</div>
                    <div><strong>Request ID:</strong> {debugInfo.requestId}</div>
                    <div><strong>Código Detectado:</strong> {debugInfo.detectedCode || 'N/A'}</div>
                    <div><strong>Nome Detectado:</strong> {debugInfo.detectedName || 'N/A'}</div>
                    <div className="pt-2 border-t">
                      <strong>Preview do documento:</strong>
                      <pre className="mt-1 text-xs bg-secondary p-2 rounded max-h-32 overflow-auto">
                        {debugInfo.preview}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
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
        </DialogFooter>
      </DialogContent>

      {/* FASE 4: Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>⚠️ Confirme os Dados Extraídos</AlertDialogTitle>
            <AlertDialogDescription>
              Revise cuidadosamente os dados antes de aplicar ao formulário.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <div><strong>📁 Arquivo processado:</strong> {debugInfo?.fileName}</div>
                  <div><strong>🔢 Código detectado:</strong> {debugInfo?.detectedCode || 'Não encontrado'}</div>
                  <div><strong>📋 Nome detectado:</strong> {debugInfo?.detectedName || 'Não encontrado'}</div>
                </div>
              </AlertDescription>
            </Alert>

            {extractedData && (
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Dados Básicos</p>
                  <p className="text-2xl font-bold">{countFields(extractedData.basic_data)}</p>
                  <p className="text-xs text-muted-foreground">campos preenchidos</p>
                </div>
                
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Especificações</p>
                  <p className="text-2xl font-bold">{countFields(extractedData.specifications)}</p>
                  <p className="text-xs text-muted-foreground">campos preenchidos</p>
                </div>
                
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Memorial</p>
                  <p className="text-2xl font-bold">{extractedData.memorial_items?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">itens identificados</p>
                </div>
                
                <div className="p-3 bg-secondary rounded-lg">
                  <p className="text-sm text-muted-foreground">Opcionais</p>
                  <p className="text-2xl font-bold">{extractedData.options?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">itens encontrados</p>
                </div>
              </div>
            )}

            <Alert variant="destructive" className="bg-destructive/10">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>⚠️ ATENÇÃO:</strong> Confirme que o código e nome do modelo estão CORRETOS antes de aplicar.
                Se estiverem errados, clique em "Reprocessar".
              </AlertDescription>
            </Alert>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button variant="outline" onClick={handleReprocess}>
              Reprocessar
            </Button>
            <AlertDialogAction onClick={handleConfirmApply}>
              ✅ Sim, Aplicar ao Formulário
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
