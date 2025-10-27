import { AdminLayout } from "@/components/AdminLayout";
import { useJobStops } from "@/hooks/useJobStops";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminJobStops() {
  const { data: jobStops, isLoading } = useJobStops();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Job-Stops (Marcos de Construção)</h1>
          <p className="text-muted-foreground mt-2">
            Marcos temporais para definição de itens configuráveis durante a construção
          </p>
        </div>

        <Alert>
          <Calendar className="h-4 w-4" />
          <AlertTitle>Sobre Job-Stops</AlertTitle>
          <AlertDescription>
            Job-Stops são marcos na linha do tempo de construção que determinam até quando 
            configurações específicas devem ser definidas. Itens configuráveis podem ser 
            vinculados a um Job-Stop para respeitar prazos de produção.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Job-Stops Cadastrados</CardTitle>
            <CardDescription>
              Lista de todos os marcos de construção disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Ordem</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-24 text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobStops?.map((jobStop) => (
                    <TableRow key={jobStop.id}>
                      <TableCell className="font-medium">
                        <Badge variant="outline">#{jobStop.display_order}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {jobStop.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {jobStop.description}
                      </TableCell>
                      <TableCell className="text-center">
                        {jobStop.is_active ? (
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="gap-1">
                            <XCircle className="h-3 w-3" />
                            Inativo
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoading && (!jobStops || jobStops.length === 0) && (
              <div className="text-center py-12 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Nenhum Job-Stop cadastrado</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Como Usar Job-Stops</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">1. Vincular Item Configurável ao Job-Stop</h3>
              <p className="text-sm text-muted-foreground">
                Ao criar ou editar um item do memorial ou opcional, marque como "Configurável" 
                e selecione o Job-Stop apropriado.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">2. Durante a Configuração</h3>
              <p className="text-sm text-muted-foreground">
                Na fase de configuração da cotação, o sistema mostrará até quando cada item 
                configurável precisa ser definido, baseado no Job-Stop vinculado.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Após Assinatura do Contrato</h3>
              <p className="text-sm text-muted-foreground">
                Configurações pendentes podem ser definidas através de ATOs (Additional To Order), 
                respeitando sempre os prazos dos Job-Stops.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
