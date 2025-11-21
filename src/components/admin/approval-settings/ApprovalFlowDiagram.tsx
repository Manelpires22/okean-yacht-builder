const MermaidDiagram = ({ children }: { children: string }) => {
  return (
    <div 
      className="mermaid-diagram p-4 bg-muted/30 rounded-lg overflow-x-auto"
      dangerouslySetInnerHTML={{
        __html: `<lov-mermaid>${children}</lov-mermaid>`
      }}
    />
  );
};

export function ApprovalFlowDiagram() {
  const mermaidCode = `graph TD
    Start([Vendedor cria/edita cotação]) --> CheckDiscount{Desconto aplicado?}
    
    CheckDiscount -->|Não| CheckCustom{Tem customizações?}
    CheckDiscount -->|Sim| EvalDiscount{Desconto > Limite?}
    
    EvalDiscount -->|Não - Auto-aprovado| CheckCustom
    EvalDiscount -->|Sim| EvalDiscountLevel{Qual o nível?}
    
    EvalDiscountLevel -->|Até limite Diretor| DirApproval[🔍 Aprovação Diretor Comercial]
    EvalDiscountLevel -->|Acima limite Diretor| AdminApproval[🔍 Aprovação Administrador]
    
    DirApproval --> DirDecision{Decisão Diretor}
    AdminApproval --> AdminDecision{Decisão Admin}
    
    DirDecision -->|Aprovado| CheckCustom
    DirDecision -->|Rejeitado| Rejected([❌ Cotação Rejeitada])
    
    AdminDecision -->|Aprovado| CheckCustom
    AdminDecision -->|Rejeitado| Rejected
    
    CheckCustom -->|Não| Approved([✅ Cotação Aprovada])
    CheckCustom -->|Sim| PMApproval[🔧 Aprovação PM]
    
    PMApproval --> PMDecision{Decisão PM}
    
    PMDecision -->|Aprovado - Define custo/prazo| Approved
    PMDecision -->|Rejeitado| Rejected
    
    Approved --> ReadyToSend([📧 Pronta para envio])
    Rejected --> BackToDraft([↩️ Volta para rascunho])
    
    style Start fill:#e3f2fd
    style Approved fill:#c8e6c9
    style Rejected fill:#ffcdd2
    style ReadyToSend fill:#fff9c4
    style BackToDraft fill:#ffe0b2
    style DirApproval fill:#fff3e0
    style AdminApproval fill:#fce4ec
    style PMApproval fill:#e1f5fe`;

  return (
    <div className="w-full overflow-x-auto">
      <MermaidDiagram>{mermaidCode}</MermaidDiagram>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div className="p-3 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-orange-300" />
            <h4 className="font-semibold">Aprovação Comercial</h4>
          </div>
          <p className="text-muted-foreground">
            Validação de descontos por Diretor ou Admin conforme limite excedido
          </p>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-blue-300" />
            <h4 className="font-semibold">Aprovação Técnica</h4>
          </div>
          <p className="text-muted-foreground">
            PM de Engenharia analisa e aprova customizações diretamente, definindo custo e prazo
          </p>
        </div>
        <div className="p-3 border rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-3 w-3 rounded-full bg-green-300" />
            <h4 className="font-semibold">Auto-aprovada</h4>
          </div>
          <p className="text-muted-foreground">
            Cotações sem descontos excessivos nem customizações seguem direto para envio
          </p>
        </div>
      </div>
    </div>
  );
}
