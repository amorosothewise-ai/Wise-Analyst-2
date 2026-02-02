export interface RawTransaction {
  Data: string;
  Operadora: string;
  Cliente: string;
  Pacote: string;
  Categoria?: string;
  "Valor Venda": string;
  "Valor Venda (MT)"?: string;
  Custo?: string;
  "Custo (MT)"?: string;
  Lucro?: string;
  "Lucro (MT)"?: string;
  Status: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  operator: string;
  client: string;
  package: string;
  category: string;
  saleValue: number;
  cost: number;
  profit: number;
  status: 'Pago' | 'Pendente' | 'Falha' | string;
}

export interface DashboardStats {
  totalRevenue: number;
  totalProfit: number;
  totalCost: number;
  salesCount: number;
  avgTicket: number;
  topPackages: Array<{ name: string; value: number }>;
  topOperators: Array<{ name: string; value: number }>;
  topCategories: Array<{ name: string; value: number }>;
  revenueOverTime: Array<{ date: string; value: number; profit: number }>;
  statusDistribution: Array<{ name: string; value: number }>;
  topClients: Array<{ name: string; totalSpent: number; transactions: number }>;
}

export enum SortField {
  DATE = 'date',
  SALE_VALUE = 'saleValue',
  PROFIT = 'profit',
  CLIENT = 'client',
  CATEGORY = 'category'
}

export enum SortDirection {
  ASC = 'asc',
  DESC = 'desc'
}