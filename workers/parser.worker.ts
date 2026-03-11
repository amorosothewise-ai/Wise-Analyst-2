import * as XLSX from 'xlsx';
import { Transaction } from '../types';

// Helper functions copied from helpers.ts to be used in the worker
const generateId = () => Math.random().toString(36).substr(2, 9);

const normalizeDate = (dateStr: string): string => {
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
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  return cleanDate.split('T')[0];
};

const cleanValue = (val: string) => val ? val.trim().replace(/"/g, '') : '';

const parseMoney = (val: string | undefined): number => {
  if (!val) return 0;
  const clean = cleanValue(val);
  return parseFloat(clean.replace(',', '.'));
};

const calculateEconomics = (saleVal: number, costVal: number, profitVal: number) => {
  let cost = costVal;
  let profit = profitVal;
  const sale = saleVal;

  if (profit > 0 && cost === 0) cost = sale - profit;
  if (cost > 0 && profit === 0) profit = sale - cost;

  return { cost, profit };
};

const processJSONData = (data: any[]): Transaction[] => {
  if (!data || data.length === 0) return [];
  
  const getField = (row: any, searchTerms: string[]) => {
    const key = Object.keys(row).find(k => searchTerms.some(s => k.toLowerCase().includes(s.toLowerCase())));
    return key ? row[key] : '';
  };

  return data.map(row => {
    const pkg = cleanValue(String(getField(row, ['pacote', 'package']))) || 'Geral';
    const client = cleanValue(String(getField(row, ['cliente', 'client', 'nome']))) || 'Desconhecido';
    
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

const parseCSV = (csvText: string): Transaction[] => {
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

self.onmessage = (e: MessageEvent) => {
  const { fileData, extension } = e.data;
  
  try {
    let result: Transaction[] = [];
    
    if (extension === 'csv') {
      result = parseCSV(fileData as string);
    } else if (extension === 'json') {
      const data = JSON.parse(fileData as string);
      const arrayData = Array.isArray(data) ? data : [data];
      result = processJSONData(arrayData);
    } else if (extension === 'xlsx' || extension === 'xls') {
      const workbook = XLSX.read(fileData, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const json = XLSX.utils.sheet_to_json(worksheet);
      result = processJSONData(json);
    } else {
      throw new Error('Formato de arquivo não suportado.');
    }
    
    self.postMessage({ success: true, data: result });
  } catch (error: any) {
    self.postMessage({ success: false, error: error.message });
  }
};
