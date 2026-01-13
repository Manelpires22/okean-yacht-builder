// Tipos para integração Configurador → Simulador

export interface SimulatorPreloadData {
  // Modelo
  modelId: string;
  modelName: string;
  modelCode: string;
  originalBasePrice: number;
  
  // Valores da cotação
  faturamentoBruto: number;        // Preço final de venda
  customizacoesEstimadas: number;  // Opcionais + Upgrades + Customizações
  
  // Vendedor/Comissão
  commission?: {
    id: string;
    name: string;
    percent: number;
    type: string;
  };
  
  // Cliente
  client?: {
    id: string;
    name: string;
  };
  
  // Trade-In
  tradeIn?: {
    hasTradeIn: boolean;
    tradeInBrand: string;
    tradeInModel: string;
    tradeInYear: number | null;
    tradeInEntryValue: number;
    tradeInRealValue: number;
  };

  // Referência da cotação
  quotationId: string;
  quotationNumber: string;
}
