import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminLayout } from "@/components/AdminLayout";
import { useDiscountLimits } from "@/hooks/useDiscountLimits";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Percent } from "lucide-react";
import { EditDiscountLimitDialog } from "@/components/admin/discount-settings/EditDiscountLimitDialog";

export default function AdminDiscountSettings() {
  const { data: limits, isLoading, error } = useDiscountLimits();

  const baseLimit = limits?.find(l => l.limit_type === 'base');
  const optionsLimit = limits?.find(l => l.limit_type === 'options');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Descontos</h1>
          <p className="text-muted-foreground mt-2">
            Configure os limites de desconto que determinam quando aprovações são necessárias
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao carregar limites de desconto: {error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* Desconto Base */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Desconto Base do Iate
                  </CardTitle>
                  <CardDescription>
                    Limites de desconto sobre o preço base do modelo
                  </CardDescription>
                </div>
                {baseLimit && <EditDiscountLimitDialog limit={baseLimit} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : baseLimit ? (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Sem Aprovação
                      </span>
                      <span className="text-2xl font-bold text-success">
                        até {baseLimit.no_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendedor pode aplicar sem necessidade de aprovação
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Aprovação do Diretor Comercial
                      </span>
                      <span className="text-2xl font-bold text-warning">
                        {baseLimit.no_approval_max + 0.01}% - {baseLimit.director_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requer aprovação do Diretor Comercial
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Aprovação do Administrador
                      </span>
                      <span className="text-2xl font-bold text-destructive">
                        &gt; {baseLimit.director_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requer aprovação do Administrador
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum limite configurado
                </p>
              )}
            </CardContent>
          </Card>

          {/* Desconto Opcionais */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    Desconto em Opcionais
                  </CardTitle>
                  <CardDescription>
                    Limites de desconto sobre os opcionais selecionados
                  </CardDescription>
                </div>
                {optionsLimit && <EditDiscountLimitDialog limit={optionsLimit} />}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </>
              ) : optionsLimit ? (
                <>
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Sem Aprovação
                      </span>
                      <span className="text-2xl font-bold text-success">
                        até {optionsLimit.no_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vendedor pode aplicar sem necessidade de aprovação
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Aprovação do Diretor Comercial
                      </span>
                      <span className="text-2xl font-bold text-warning">
                        {optionsLimit.no_approval_max + 0.01}% - {optionsLimit.director_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requer aprovação do Diretor Comercial
                    </p>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Aprovação do Administrador
                      </span>
                      <span className="text-2xl font-bold text-destructive">
                        &gt; {optionsLimit.director_approval_max}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Requer aprovação do Administrador
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum limite configurado
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Atenção:</strong> Alterações nos limites de desconto afetam todas as novas cotações.
            Cotações existentes mantêm os limites que estavam em vigor no momento da criação.
          </AlertDescription>
        </Alert>
      </div>
    </AdminLayout>
  );
}
