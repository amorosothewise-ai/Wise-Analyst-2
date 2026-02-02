import { Transaction, DashboardStats } from '../types';

// Formata moeda para Metical Moçambicano
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-MZ', {
    style: 'currency',
    currency: 'MZN',
  }).format(value);
};

// Gera um ID único simples
const generateId = () => Math.random().toString(36).substr(2, 9);

// Normaliza data para YYYY-MM-DD
// Suporta "DD/MM/YYYY", "DD/MM/YYYY, HH:mm:ss", "YYYY-MM-DD"
export const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return new Date().toISOString().split('T')[0];
  
  let cleanDate = dateStr;
  if (dateStr.includes(',')) {
    cleanDate = dateStr.split(',')[0].trim();
  } else if (dateStr.includes(' ') && dateStr.includes(':')) {
    cleanDate = dateStr.split(' ')[0].trim();
  }

  if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/');
    if (parts.length === 3) {
      // Assume DD/MM/YYYY para YYYY-MM-DD
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return cleanDate.split('T')[0];
};

// Remove aspas e espaços extras
const cleanValue = (val: string) => val ? val.trim().replace(/"/g, '') : '';

// Parser numérico robusto
const parseMoney = (val: string | undefined): number => {
  if (!val) return 0;
  const clean = cleanValue(val);
  return parseFloat(clean.replace(',', '.'));
};

// Regras de Negócio para Cálculo de Lucro
const calculateEconomics = (pkg: string, saleVal: number, costVal: number, profitVal: number) => {
  let cost = costVal;
  let profit = profitVal;
  const sale = saleVal;

  if (profit > 0 && cost === 0) cost = sale - profit;
  if (cost > 0 && profit === 0) profit = sale - cost;

  return { cost, profit };
};

// Parser de CSV
export const parseCSV = (csvText: string): Transaction[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const delimiter = headerLine.includes(';') ? ';' : ',';
  
  const headers = headerLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
  
  const getColIndex = (search: string[]) => {
    return headers.findIndex(h => search.some(s => h.toLowerCase() === s.toLowerCase() || h.toLowerCase().includes(s.toLowerCase())));
  };

  const idxDate = getColIndex(['Data']);
  const idxOperator = getColIndex(['Operadora']);
  const idxClient = getColIndex(['Cliente']);
  const idxPackage = getColIndex(['Pacote']);
  const idxCategory = getColIndex(['Categoria']);
  const idxSale = getColIndex(['Valor Venda', 'Venda']);
  const idxCost = getColIndex(['Custo']);
  const idxProfit = getColIndex(['Lucro']);
  const idxStatus = getColIndex(['Status']);

  const transactions: Transaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i].trim();
    if (!currentLine) continue;

    const values = currentLine.split(delimiter).map(v => cleanValue(v));
    const getVal = (idx: number) => idx !== -1 ? values[idx] : '';

    const pkg = getVal(idxPackage) || 'Geral';
    const rawSale = parseMoney(getVal(idxSale));
    let rawCost = parseMoney(getVal(idxCost));
    let rawProfit = parseMoney(getVal(idxProfit));

    if (idxCost === -1 && idxProfit === -1) {
        const pkgLower = pkg.toLowerCase();
        if (pkgLower.includes('crédito 500')) {
            rawProfit = 90;
        } else if (pkgLower.includes('1024mb')) {
            rawProfit = 6;
        } else if (pkgLower.includes('5gb')) {
            rawProfit = 20;
        } else {
            rawProfit = rawSale * 0.15;
        }
        rawCost = rawSale - rawProfit;
    } else {
        const { cost, profit } = calculateEconomics(pkg, rawSale, rawCost, rawProfit);
        rawCost = cost;
        rawProfit = profit;
    }

    transactions.push({
      id: generateId(),
      date: normalizeDate(getVal(idxDate)),
      operator: getVal(idxOperator) || 'Outros',
      client: getVal(idxClient) || 'Desconhecido',
      package: pkg,
      category: getVal(idxCategory) || 'Geral',
      saleValue: rawSale,
      cost: Number(rawCost.toFixed(2)),
      profit: Number(rawProfit.toFixed(2)),
      status: getVal(idxStatus) || 'Pendente'
    });
  }

  return transactions;
};

// Funções de Filtro
export type DateRangeType = 'all' | 'today' | 'week' | 'month' | 'year';

export const filterTransactions = (
  transactions: Transaction[], 
  operator: string, 
  dateRange: DateRangeType
): Transaction[] => {
  const now = new Date();
  // Zera horas para comparação justa de datas
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return transactions.filter(t => {
    // Filtro de Operadora
    if (operator !== 'Todos' && t.operator !== operator) {
      return false;
    }

    // Filtro de Data
    if (dateRange === 'all') return true;

    // Converte string YYYY-MM-DD para Date
    // Adiciona T00:00:00 para garantir timezone local no parse simples ou split manual
    const parts = t.date.split('-');
    const itemDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));

    if (dateRange === 'today') {
        return itemDate.getTime() === today.getTime();
    }
    
    if (dateRange === 'week') {
      const oneWeekAgo = new Date(today);
      oneWeekAgo.setDate(today.getDate() - 7);
      return itemDate >= oneWeekAgo && itemDate <= now;
    }

    if (dateRange === 'month') {
      return itemDate.getMonth() === today.getMonth() && itemDate.getFullYear() === today.getFullYear();
    }

    if (dateRange === 'year') {
      return itemDate.getFullYear() === today.getFullYear();
    }

    return true;
  });
};

// Agregação de Dados para Dashboard
export const calculateStats = (data: Transaction[]): DashboardStats => {
  const totalRevenue = data.reduce((acc, curr) => acc + curr.saleValue, 0);
  const totalProfit = data.reduce((acc, curr) => acc + curr.profit, 0);
  const totalCost = data.reduce((acc, curr) => acc + curr.cost, 0);
  const salesCount = data.length;
  const avgTicket = salesCount > 0 ? totalRevenue / salesCount : 0;

  const countByField = (field: keyof Transaction, limit = 10) => {
    const map = new Map<string, number>();
    data.forEach(t => {
      const val = String(t[field]);
      map.set(val, (map.get(val) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, limit);
  };

  const topPackages = countByField('package', 10);
  const topOperators = countByField('operator', 10);
  const topCategories = countByField('category', 10);
  const statusDistribution = countByField('status', 10);

  const dateMap = new Map<string, { revenue: number; profit: number }>();
  data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .forEach(t => {
        const current = dateMap.get(t.date) || { revenue: 0, profit: 0 };
        dateMap.set(t.date, { 
          revenue: current.revenue + t.saleValue,
          profit: current.profit + t.profit
        });
      });
  const revenueOverTime = Array.from(dateMap.entries())
    .map(([date, val]) => ({ 
      date, 
      value: Number(val.revenue.toFixed(2)),
      profit: Number(val.profit.toFixed(2))
    }));

  const clientMap = new Map<string, { spent: number; count: number }>();
  data.forEach(t => {
    const current = clientMap.get(t.client) || { spent: 0, count: 0 };
    clientMap.set(t.client, {
      spent: current.spent + t.saleValue,
      count: current.count + 1
    });
  });
  const topClients = Array.from(clientMap.entries())
    .map(([name, val]) => ({ name, totalSpent: val.spent, transactions: val.count }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, 5);

  return {
    totalRevenue,
    totalProfit,
    totalCost,
    salesCount,
    avgTicket,
    topPackages,
    topOperators,
    topCategories,
    revenueOverTime,
    statusDistribution,
    topClients
  };
};