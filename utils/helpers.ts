import { Transaction, DashboardStats } from '../types';
import * as XLSX from 'xlsx';
import ParserWorker from '../workers/parser.worker?worker';

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

// Remove aspas, espaços extras e normaliza para comparação
const cleanValue = (val: string) => val ? val.trim().replace(/"/g, '') : '';

// Normaliza nomes para agrupamento (evita duplicatas por capitalização ou espaços)
export const normalizeName = (name: string) => name.trim().toLowerCase().replace(/\s+/g, ' ');

// Parser numérico robusto
const parseMoney = (val: string | undefined): number => {
  if (!val) return 0;
  const clean = cleanValue(val);
  return parseFloat(clean.replace(',', '.'));
};

// Regras de Negócio para Cálculo de Lucro
const calculateEconomics = (saleVal: number, costVal: number, profitVal: number) => {
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
    const client = getVal(idxClient) || 'Desconhecido';
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
        const { cost, profit } = calculateEconomics(rawSale, rawCost, rawProfit);
        rawCost = cost;
        rawProfit = profit;
    }

    transactions.push({
      id: generateId(),
      date: normalizeDate(getVal(idxDate)),
      operator: getVal(idxOperator) || 'Outros',
      client: client,
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

// Funções de Filtro atualizadas para suportar Start/End Date
export const filterTransactions = (
  transactions: Transaction[], 
  operator: string, 
  startDate: string,
  endDate: string
): Transaction[] => {
  return transactions.filter(t => {
    // Filtro de Operadora
    if (operator !== 'Todos' && t.operator !== operator) {
      return false;
    }

    // Filtro de Data (Comparação de String ISO YYYY-MM-DD funciona corretamente)
    if (startDate && t.date < startDate) return false;
    if (endDate && t.date > endDate) return false;

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
    const map = new Map<string, { count: number; originalName: string }>();
    data.forEach(t => {
      const rawVal = String(t[field]);
      const normalized = normalizeName(rawVal);
      const current = map.get(normalized) || { count: 0, originalName: rawVal };
      map.set(normalized, { 
        count: current.count + 1, 
        originalName: current.originalName // Keep the first occurrence's casing
      });
    });
    return Array.from(map.values())
      .map(item => ({ name: item.originalName, value: item.count }))
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

  const clientMap = new Map<string, { spent: number; count: number; originalName: string }>();
  data.forEach(t => {
    const normalized = normalizeName(t.client);
    const current = clientMap.get(normalized) || { spent: 0, count: 0, originalName: t.client };
    clientMap.set(normalized, {
      spent: current.spent + t.saleValue,
      count: current.count + 1,
      originalName: current.originalName
    });
  });
  const topClients = Array.from(clientMap.values())
    .map(val => ({ name: val.originalName, totalSpent: val.spent, transactions: val.count }))
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

// Processa array de objetos (JSON ou Excel)
const processJSONData = (data: any[]): Transaction[] => {
  if (!data || data.length === 0) return [];
  
  // Identifica as chaves baseadas em possíveis nomes
  const getField = (row: any, searchTerms: string[]) => {
    const key = Object.keys(row).find(k => searchTerms.some(s => k.toLowerCase().includes(s.toLowerCase())));
    return key ? row[key] : '';
  };

  return data.map(row => {
    const pkg = cleanValue(String(getField(row, ['pacote', 'package']))) || 'Geral';
    const client = cleanValue(String(getField(row, ['cliente', 'client', 'nome']))) || 'Desconhecido';
    
    // Extrai valores brutos
    let rawSale = 0;
    let rawCost = 0;
    let rawProfit = 0;
    
    const saleField = getField(row, ['valor venda', 'venda', 'sale', 'price', 'valor']);
    if (saleField !== undefined && saleField !== '') rawSale = typeof saleField === 'number' ? saleField : parseMoney(String(saleField));
    
    const costField = getField(row, ['custo', 'cost']);
    if (costField !== undefined && costField !== '') rawCost = typeof costField === 'number' ? costField : parseMoney(String(costField));
    
    const profitField = getField(row, ['lucro', 'profit']);
    if (profitField !== undefined && profitField !== '') rawProfit = typeof profitField === 'number' ? profitField : parseMoney(String(profitField));

    if (rawCost === 0 && rawProfit === 0) {
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
        const { cost, profit } = calculateEconomics(rawSale, rawCost, rawProfit);
        rawCost = cost;
        rawProfit = profit;
    }

    // Lida com datas do Excel (números de série)
    let dateStr = getField(row, ['data', 'date']);
    if (typeof dateStr === 'number') {
      const excelEpoch = new Date(1899, 11, 30);
      const date = new Date(excelEpoch.getTime() + (dateStr - 1) * 86400000);
      dateStr = date.toISOString().split('T')[0];
    } else {
      dateStr = normalizeDate(cleanValue(String(dateStr)));
    }

    return {
      id: generateId(),
      date: dateStr,
      operator: cleanValue(String(getField(row, ['operadora', 'operator']))) || 'Outros',
      client: client,
      package: pkg,
      category: cleanValue(String(getField(row, ['categoria', 'category']))) || 'Geral',
      saleValue: rawSale,
      cost: Number(rawCost.toFixed(2)),
      profit: Number(rawProfit.toFixed(2)),
      status: cleanValue(String(getField(row, ['status', 'estado']))) || 'Pendente'
    };
  });
};

// Função principal para processar diferentes tipos de arquivos usando Web Worker
export const parseFile = async (file: File): Promise<Transaction[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const fileData = e.target?.result;
        
        // Instantiate the worker
        const worker = new ParserWorker();

        worker.onmessage = (event) => {
          if (event.data.success) {
            resolve(event.data.data);
          } else {
            reject(new Error(event.data.error));
          }
          worker.terminate();
        };

        worker.onerror = (error) => {
          reject(error);
          worker.terminate();
        };

        worker.postMessage({ fileData, extension });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erro ao ler o arquivo.'));

    if (extension === 'xlsx' || extension === 'xls') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
};
