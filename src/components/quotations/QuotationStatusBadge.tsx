import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  CheckCircle2, 
  Send, 
  ThumbsUp, 
  XCircle, 
  AlertCircle,
  FileText
} from "lucide-react";

type QuotationStatus = 
  | 'draft'
  | 'pending_commercial_approval'
  | 'pending_technical_approval'
  | 'ready_to_send'
  | 'sent'
  | 'approved'
  | 'accepted'
  | 'rejected'
  | 'expired';

interface QuotationStatusBadgeProps {
  status: QuotationStatus;
  className?: string;
}

const STATUS_CONFIG = {
  draft: {
    label: "Rascunho",
    variant: "secondary" as const,
    icon: FileText,
    color: "text-muted-foreground"
  },
  pending_commercial_approval: {
    label: "Aguardando Aprovação Comercial",
    variant: "outline" as const,
    icon: Clock,
    color: "text-yellow-600"
  },
  pending_technical_approval: {
    label: "Aguardando Validação Técnica",
    variant: "outline" as const,
    icon: Clock,
    color: "text-orange-600"
  },
  ready_to_send: {
    label: "Pronta para Envio",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600"
  },
  sent: {
    label: "Enviada ao Cliente",
    variant: "default" as const,
    icon: Send,
    color: "text-blue-600"
  },
  approved: {
    label: "Aprovada Internamente",
    variant: "default" as const,
    icon: CheckCircle2,
    color: "text-green-600"
  },
  accepted: {
    label: "Aceita pelo Cliente",
    variant: "default" as const,
    icon: ThumbsUp,
    color: "text-green-700"
  },
  rejected: {
    label: "Rejeitada",
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-destructive"
  },
  expired: {
    label: "Expirada",
    variant: "secondary" as const,
    icon: AlertCircle,
    color: "text-muted-foreground"
  }
};

export function QuotationStatusBadge({ status, className }: QuotationStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={className}>
      <Icon className={`mr-1.5 h-3.5 w-3.5 ${config.color}`} />
      {config.label}
    </Badge>
  );
}
