import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApprovalFlowDiagram } from "@/components/admin/approval-settings/ApprovalFlowDiagram";
import { PermissionsMatrix } from "@/components/admin/approval-settings/PermissionsMatrix";
import { ApprovalTypesCards } from "@/components/admin/approval-settings/ApprovalTypesCards";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, BookOpen, Percent, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function AdminApprovalSettings() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Aprovações</h1>
            <p className="text-muted-foreground mt-2">
              Documentação completa do sistema de aprovações e validações
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/admin/discount-settings">
              Configurar Limites de Desconto
            </Link>
          </Button>
        </div>

        {/* Alert Informativo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Esta página documenta como funcionam as aprovações automáticas de descontos e customizações.
            As regras são aplicadas automaticamente quando vendedores criam ou editam cotações.
          </AlertDescription>
        </Alert>

        {/* Fluxo de Aprovações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Fluxo Completo de Aprovações
            </CardTitle>
            <CardDescription>
              Diagrama visual mostrando quando e como as aprovações são acionadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ApprovalFlowDiagram />
          </CardContent>
        </Card>

        {/* Tipos de Aprovação */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Tipos de Aprovação</h2>
          <ApprovalTypesCards />
        </div>

        {/* Matriz de Permissões */}
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Permissões por Role</CardTitle>
            <CardDescription>
              Referência rápida de quem pode fazer o quê no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PermissionsMatrix />
          </CardContent>
        </Card>

        {/* Onde Configurar as Regras */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              ⚙️ Onde Configurar as Regras de Aprovação
            </CardTitle>
            <CardDescription>
              Locais onde você pode modificar as regras do sistema de aprovações
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 border rounded-lg bg-background">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Percent className="h-4 w-4 text-orange-600" />
                  Limites de Desconto
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Configure os percentuais que acionam aprovação automática de Diretor ou Admin.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/discount-settings">
                    Ir para Gestão de Descontos
                  </Link>
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-background">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Atribuições de PM
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Defina qual PM de Engenharia é responsável por cada modelo de iate.
                </p>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/users">
                    Ir para Utilizadores
                  </Link>
                </Button>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-semibold mb-2">📁 Arquivos de Código (para desenvolvedores)</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                <li><code className="text-xs bg-background px-1 py-0.5 rounded">src/lib/approval-utils.ts</code> - Lógica de cálculo de aprovações de desconto</li>
                <li><code className="text-xs bg-background px-1 py-0.5 rounded">src/hooks/useApprovals.ts</code> - Determinação de aprovador (PM para customizações, Diretor/Admin para descontos)</li>
                <li><code className="text-xs bg-background px-1 py-0.5 rounded">supabase/migrations/</code> - RLS policies e permissões de banco de dados</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Estados de Cotação */}
        <Card>
          <CardHeader>
            <CardTitle>Ciclo de Vida das Cotações</CardTitle>
            <CardDescription>
              Entenda os diferentes estados que uma cotação pode ter
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-gray-400 mt-2" />
                <div>
                  <h4 className="font-semibold">Draft (Rascunho)</h4>
                  <p className="text-sm text-muted-foreground">
                    Cotação em edição. Vendedor pode modificar livremente.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-yellow-500 mt-2" />
                <div>
                  <h4 className="font-semibold">Pending Approval (Aguardando Aprovação)</h4>
                  <p className="text-sm text-muted-foreground">
                    Cotação com descontos ou customizações que requerem validação.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-green-500 mt-2" />
                <div>
                  <h4 className="font-semibold">Approved (Aprovada)</h4>
                  <p className="text-sm text-muted-foreground">
                    Todas as aprovações concluídas. Pronta para enviar ao cliente.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <h4 className="font-semibold">Sent (Enviada)</h4>
                  <p className="text-sm text-muted-foreground">
                    Cotação enviada ao cliente via email. Aguardando resposta.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                <div>
                  <h4 className="font-semibold">Accepted (Aceita)</h4>
                  <p className="text-sm text-muted-foreground">
                    Cliente aceitou a cotação. Processo de venda iniciado.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="h-2 w-2 rounded-full bg-red-500 mt-2" />
                <div>
                  <h4 className="font-semibold">Rejected (Rejeitada)</h4>
                  <p className="text-sm text-muted-foreground">
                    Aprovação negada. Vendedor deve revisar e ajustar.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQs */}
        <Card>
          <CardHeader>
            <CardTitle>Perguntas Frequentes (FAQs)</CardTitle>
            <CardDescription>
              Respostas para dúvidas comuns sobre o sistema de aprovações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>
                  Por que minha cotação ficou "Aguardando Aprovação"?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Sua cotação requer aprovação quando:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Desconto na base excede o limite permitido para seu role</li>
                    <li>Desconto nos opcionais excede o limite configurado</li>
                    <li>Cliente solicitou customizações técnicas no memorial descritivo</li>
                  </ul>
                  Verifique os limites de desconto na página de <Link to="/admin/discount-settings" className="text-primary underline">Gestão de Descontos</Link>.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-2">
                <AccordionTrigger>
                  Quem pode aprovar meu desconto?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Depende do percentual de desconto aplicado:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Até o limite sem aprovação:</strong> Aprovação automática</li>
                    <li><strong>Acima do limite, até o limite de Diretor:</strong> Requer aprovação de <strong>Diretor Comercial</strong></li>
                    <li><strong>Acima do limite de Diretor:</strong> Requer aprovação de <strong>Administrador</strong></li>
                  </ul>
                  Consulte a tabela de limites para valores exatos.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-3">
                <AccordionTrigger>
                  Como funciona a aprovação de customizações técnicas?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Quando um cliente solicita customização (alteração de item do memorial ou adição de item novo):
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>Vendedor registra a customização no sistema com status "Pendente"</li>
                    <li>O <strong>PM de Engenharia</strong> atribuído ao modelo do iate analisa diretamente</li>
                    <li>PM aprova e define: custo adicional + impacto no prazo de entrega</li>
                    <li>A cotação é atualizada automaticamente com os novos valores</li>
                    <li>Se rejeitada, vendedor é notificado para ajustar ou informar o cliente</li>
                  </ol>
                  <p className="mt-2 text-sm">
                    <strong>Tempo estimado:</strong> 2-3 dias úteis (simplificado do fluxo anterior de 10+ dias)
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-4">
                <AccordionTrigger>
                  Posso editar uma cotação após ela ser aprovada?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  <strong>Não diretamente.</strong> Uma vez aprovada, a cotação está bloqueada para edição.
                  <br /><br />
                  <strong>Opções disponíveis:</strong>
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li><strong>Criar Revisão:</strong> Gera nova versão mantendo histórico da original</li>
                    <li><strong>Cancelar e criar nova:</strong> Cancela a atual e inicia do zero</li>
                  </ul>
                  Isso garante rastreabilidade e previne mudanças não autorizadas em cotações já validadas.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-5">
                <AccordionTrigger>
                  Como sei se uma cotação tem customizações pendentes?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Na página de detalhes da cotação, você verá:
                  <ul className="list-disc pl-6 mt-2 space-y-1">
                    <li>Badge laranja "Customizações Pendentes" no cabeçalho</li>
                    <li>Card "Status de Customizações" com lista de itens pendentes</li>
                    <li>Status geral "Aguardando Aprovação Técnica"</li>
                  </ul>
                  Engenheiros são notificados automaticamente quando há customizações para analisar.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="item-6">
                <AccordionTrigger>
                  O que acontece se minha aprovação for rejeitada?
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Quando uma aprovação é rejeitada:
                  <ol className="list-decimal pl-6 mt-2 space-y-1">
                    <li>A cotação volta ao status "Rejected" (Rejeitada)</li>
                    <li>Você recebe uma notificação com as notas do revisor</li>
                    <li>A cotação pode ser editada novamente (volta a "Draft")</li>
                    <li>Você deve ajustar os descontos ou remover customizações problemáticas</li>
                    <li>Após ajustes, pode salvar novamente e reenviar para aprovação</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Dicas e Boas Práticas */}
        <Card>
          <CardHeader>
            <CardTitle>💡 Dicas e Boas Práticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-1">✅ Planeje descontos dentro dos limites</h4>
              <p className="text-sm text-muted-foreground">
                Conheça seus limites de desconto para evitar atrasos nas cotações. Cotações sem aprovação são processadas mais rapidamente.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-1">✅ Documente bem as customizações</h4>
              <p className="text-sm text-muted-foreground">
                Forneça descrições detalhadas e anexe arquivos (desenhos, specs) para facilitar a análise da engenharia.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-1">✅ Acompanhe aprovações pendentes</h4>
              <p className="text-sm text-muted-foreground">
                Use a página de <Link to="/aprovacoes" className="text-primary underline">Aprovações</Link> para monitorar status em tempo real.
              </p>
            </div>
            <div className="p-3 bg-muted rounded-lg">
              <h4 className="font-semibold mb-1">✅ Comunique-se com os aprovadores</h4>
              <p className="text-sm text-muted-foreground">
                Use o campo de notas nas aprovações para contextualizar suas solicitações e acelerar o processo.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
