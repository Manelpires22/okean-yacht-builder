import { User, Briefcase, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface QuotationInfoGridProps {
  client: {
    name: string;
    company?: string;
    email?: string;
    phone?: string;
  };
  seller: {
    name: string;
  };
  quotation: {
    createdAt: string;
    validUntil: string;
  };
}

export function QuotationInfoGrid({ client, seller, quotation }: QuotationInfoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Cliente */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <User className="h-5 w-5 text-primary" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Cliente</p>
          <p className="font-semibold truncate">{client.name}</p>
          {client.company && (
            <p className="text-sm text-muted-foreground truncate flex items-center gap-1">
              <Briefcase className="h-3 w-3" />
              {client.company}
            </p>
          )}
          {client.email && (
            <p className="text-xs text-muted-foreground truncate">{client.email}</p>
          )}
        </div>
      </div>

      {/* Vendedor */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-secondary/50 flex items-center justify-center">
            <User className="h-5 w-5 text-secondary-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Vendedor</p>
          <p className="font-semibold truncate">{seller.name}</p>
        </div>
      </div>

      {/* Datas */}
      <div className="flex gap-3">
        <div className="flex-shrink-0">
          <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-accent-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">Datas</p>
          <p className="text-sm flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Criada: {format(new Date(quotation.createdAt), "dd/MM/yyyy", { locale: ptBR })}
          </p>
          <p className="text-sm flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Válida até: {format(new Date(quotation.validUntil), "dd/MM/yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>
    </div>
  );
}
