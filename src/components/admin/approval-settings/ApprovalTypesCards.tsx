import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Percent, Wrench, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function ApprovalTypesCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Aprovação Comercial */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Percent className="h-5 w-5 text-orange-600" />
            </div>
            <div className="flex-1">
              <CardTitle>Aprovação Comercial</CardTitle>
              <CardDescription>Validação de descontos aplicados</CardDescription>
            </div>
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              Descontos
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              O que é?
            </h4>
            <p className="text-sm text-muted-foreground">
              Quando um vendedor aplica descontos acima dos limites permitidos para seu role,
              o sistema cria automaticamente uma solicitação de aprovação comercial.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📋 Quando ocorre?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Desconto na base do modelo excede o limite configurado</li>
              <li>Desconto total nos opcionais excede o limite configurado</li>
              <li>Ao salvar a cotação com esses descontos</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">👤 Quem aprova?</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Badge variant="destructive" className="mt-0.5">Diretor</Badge>
                <span className="text-muted-foreground">
                  Para descontos até o limite de Diretor Comercial
                </span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Badge variant="default" className="mt-0.5">Admin</Badge>
                <span className="text-muted-foreground">
                  Para descontos acima do limite de Diretor
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">⚡ Impacto</h4>
            <p className="text-sm text-muted-foreground">
              A cotação fica com status <strong>"Aguardando Aprovação"</strong> até ser
              revisada. Não pode ser enviada ao cliente enquanto pendente.
            </p>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Consulte a página de{" "}
              <span className="text-primary">Gestão de Descontos</span> para ver
              os limites atuais configurados para cada nível.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Aprovação Técnica */}
      <Card className="border-blue-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wrench className="h-5 w-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <CardTitle>Aprovação Técnica</CardTitle>
              <CardDescription>Validação de customizações</CardDescription>
            </div>
            <Badge variant="outline" className="text-blue-600 border-blue-600">
              Customizações
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              O que é?
            </h4>
            <p className="text-sm text-muted-foreground">
              Quando um cliente solicita alterações técnicas em itens do memorial descritivo
              ou adição de novos itens personalizados, essas customizações precisam ser
              validadas pela engenharia.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-2">📋 Quando ocorre?</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li>Cliente solicita alteração de item existente no memorial</li>
              <li>Cliente solicita adição de item customizado/novo</li>
              <li>Durante a configuração do iate no configurador</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-2">👤 Quem aprova?</h4>
            <div className="space-y-2">
              <div className="flex items-start gap-2 text-sm">
                <Badge variant="outline" className="mt-0.5">PM Engenharia</Badge>
                <div className="flex-1">
                  <span className="text-muted-foreground">
                    O PM (Project Manager) atribuído ao modelo do iate
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚙️ Configure em: Admin → Utilizadores → Atribuições PM
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <Badge variant="default" className="mt-0.5">Admin</Badge>
                <span className="text-muted-foreground">
                  Administradores têm acesso total
                </span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2">⚡ Impacto</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
              <li><strong>Custo adicional:</strong> Engenheiro define valor extra</li>
              <li><strong>Prazo de entrega:</strong> Pode adicionar dias ao cronograma</li>
              <li><strong>Status:</strong> Cotação fica "Aguardando Aprovação Técnica"</li>
            </ul>
          </div>

          <div className="p-3 bg-muted rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Dica:</strong> Forneça descrições detalhadas e anexe
              arquivos (desenhos, specs) para facilitar a análise da engenharia
              e acelerar o processo de aprovação.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
