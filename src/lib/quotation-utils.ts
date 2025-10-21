import { SelectedOption } from "@/hooks/useConfigurationState";

export function generateQuotationNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `QT-${year}-${random}`;
}

export function calculateTotalPrice(
  basePrice: number,
  selectedOptions: SelectedOption[]
): number {
  const optionsTotal = selectedOptions.reduce((sum, option) => {
    return sum + option.unit_price * option.quantity;
  }, 0);
  return basePrice + optionsTotal;
}

export function calculateTotalDeliveryDays(
  baseDays: number,
  selectedOptions: SelectedOption[]
): number {
  const maxImpact = selectedOptions.reduce((max, option) => {
    const impact = option.delivery_days_impact || 0;
    return Math.max(max, impact);
  }, 0);
  return baseDays + maxImpact;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function formatDays(days: number): string {
  if (days === 1) return "1 dia";
  return `${days} dias`;
}
