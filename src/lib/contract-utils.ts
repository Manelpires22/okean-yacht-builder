import { ATO } from "@/hooks/useATOs";

export function generateContractNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `CTR-${year}-${random}`;
}

export function generateATONumber(sequenceNumber: number): string {
  return `ATO-${sequenceNumber.toString().padStart(3, "0")}`;
}

export interface LiveContractCalculation {
  basePrice: number;
  baseDeliveryDays: number;
  approvedATOsPrice: number;
  approvedATOsDeliveryDays: number;
  totalPrice: number;
  totalDeliveryDays: number;
  approvedATOsCount: number;
  pendingATOsCount: number;
}

export function calculateLiveContract(
  basePrice: number,
  baseDeliveryDays: number,
  atos: ATO[]
): LiveContractCalculation {
  const approvedATOs = atos.filter((ato) => ato.status === "approved");
  const pendingATOs = atos.filter((ato) => ato.status === "pending_approval");

  const approvedATOsPrice = approvedATOs.reduce(
    (sum, ato) => sum + (ato.price_impact || 0),
    0
  );

  const approvedATOsDeliveryDays = approvedATOs.reduce(
    (max, ato) => Math.max(max, ato.delivery_days_impact || 0),
    0
  );

  return {
    basePrice,
    baseDeliveryDays,
    approvedATOsPrice,
    approvedATOsDeliveryDays,
    totalPrice: basePrice + approvedATOsPrice,
    totalDeliveryDays: baseDeliveryDays + approvedATOsDeliveryDays,
    approvedATOsCount: approvedATOs.length,
    pendingATOsCount: pendingATOs.length,
  };
}

export function getContractStatusLabel(
  status: "active" | "completed" | "cancelled"
): string {
  const labels = {
    active: "Ativo",
    completed: "Concluído",
    cancelled: "Cancelado",
  };
  return labels[status] || status;
}

export function getContractStatusColor(
  status: "active" | "completed" | "cancelled"
): string {
  const colors = {
    active: "bg-green-500",
    completed: "bg-blue-500",
    cancelled: "bg-gray-500",
  };
  return colors[status] || "bg-gray-500";
}

export function getATOStatusLabel(
  status: "draft" | "pending_approval" | "approved" | "rejected" | "cancelled"
): string {
  const labels = {
    draft: "Rascunho",
    pending_approval: "Enviada ao Cliente",
    approved: "Aprovada pelo Cliente",
    rejected: "Rejeitada pelo Cliente",
    cancelled: "Cancelada",
  };
  return labels[status] || status;
}

export function getATOStatusColor(
  status: "draft" | "pending_approval" | "approved" | "rejected" | "cancelled"
): string {
  const colors = {
    draft: "bg-gray-500",
    pending_approval: "bg-yellow-500",
    approved: "bg-green-500",
    rejected: "bg-red-500",
    cancelled: "bg-gray-400",
  };
  return colors[status] || "bg-gray-500";
}

export interface ContractSnapshot {
  quotation_id: string;
  quotation_number: string;
  client: any;
  yacht_model: any;
  base_price: number;
  final_price: number;
  base_delivery_days: number;
  total_delivery_days: number;
  selected_options: any[];
  customizations: any[];
  memorial_items: any[];
  created_at: string;
}

export function createContractSnapshot(quotation: any): ContractSnapshot {
  return {
    quotation_id: quotation.id,
    quotation_number: quotation.quotation_number,
    client: quotation.client,
    yacht_model: quotation.yacht_model,
    base_price: quotation.base_price,
    final_price: quotation.final_price,
    base_delivery_days: quotation.base_delivery_days,
    total_delivery_days: quotation.total_delivery_days,
    selected_options: quotation.selected_options || [],
    customizations: quotation.customizations || [],
    memorial_items: quotation.memorial_items || [],
    created_at: new Date().toISOString(),
  };
}
