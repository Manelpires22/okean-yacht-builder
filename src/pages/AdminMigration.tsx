import { useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AdminMigration() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any>(null);

  const executeMigration = async () => {
    setLoading(true);
    setReport(null);

    try {
      toast.info("Iniciando migração...", {
        description: "Isso pode levar alguns minutos. Aguarde...",
      });

      const { data, error } = await supabase.functions.invoke('migrate-memorial-complete');

      if (error) throw error;

      setReport(data);

      if (data.success) {
        toast.success("Migração concluída com sucesso!", {
          description: `${data.total_inserted} itens migrados de ${data.total_processed} processados.`,
        });
      } else {
        toast.error("Migração concluída com erros", {
          description: `${data.total_errors} erros encontrados.`,
        });
      }
    } catch (error: any) {
      toast.error("Erro ao executar migração", {
        description: error.message,
      });
      console.error("Migration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="container mx-auto p-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>🚀 Migração Memorial Okean → Memorial Items</CardTitle>
            <CardDescription>
              Migra todos os dados de memorial_okean para memorial_items com mapeamento de categorias e modelos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                <strong>Antes de executar:</strong>
                <ol className="list-decimal list-inside mt-2 space-y-1">
                  <li>Certifique-se de que a migration SQL foi executada no Supabase</li>
                  <li>Verifique que as funções normalize_memorial_category() e get_yacht_model_id() existem</li>
                  <li>Esta operação é idempotente (pode ser executada múltiplas vezes)</li>
                </ol>
              </AlertDescription>
            </Alert>

            <Button
              onClick={executeMigration}
              disabled={loading}
              size="lg"
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Executando migração...
                </>
              ) : (
                "Executar Migração"
              )}
            </Button>

            {report && (
              <Card className={report.success ? "border-green-500" : "border-red-500"}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {report.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    Relatório de Migração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Processado</p>
                      <p className="text-2xl font-bold">{report.total_processed}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Inserido</p>
                      <p className="text-2xl font-bold text-green-600">{report.total_inserted}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Pulado</p>
                      <p className="text-2xl font-bold text-yellow-600">{report.total_skipped}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Erros</p>
                      <p className="text-2xl font-bold text-red-600">{report.total_errors}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Modelos Migrados</p>
                    <div className="flex flex-wrap gap-2">
                      {report.models_migrated?.map((model: string) => (
                        <span key={model} className="px-2 py-1 bg-primary/10 text-primary rounded text-sm">
                          {model}
                        </span>
                      ))}
                    </div>
                  </div>

                  {report.details && report.details.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Detalhes por Modelo</p>
                      <div className="space-y-2">
                        {report.details.map((detail: any) => (
                          <div key={detail.model} className="flex justify-between p-2 bg-muted rounded">
                            <span className="font-medium">{detail.model}</span>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{detail.items_count} itens</span>
                              <span>{detail.categories_count} categorias</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {report.errors && report.errors.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Erros</p>
                      <div className="space-y-2 max-h-64 overflow-y-auto">
                        {report.errors.map((error: any, idx: number) => (
                          <div key={idx} className="p-2 bg-red-50 text-red-800 rounded text-sm">
                            <strong>{error.modelo}:</strong> {error.error}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
