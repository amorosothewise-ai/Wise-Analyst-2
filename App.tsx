import React, { useState, useEffect, useMemo } from 'react';
import { 
  Upload, Moon, Sun, TrendingUp, DollarSign, Users, 
  ShoppingCart, Activity, FileText, AlertCircle, Filter, Calendar
} from 'lucide-react';
import { Transaction } from './types';
import { parseCSV, calculateStats, formatCurrency, filterTransactions } from './utils/helpers';
import { RevenueAreaChart, TopPackagesBarChart, GenericDonutChart } from './components/Charts';
import { TransactionTable } from './components/TransactionTable';

// Component defined outside to prevent re-creation on every render
const KPICard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
  <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-start justify-between hover:shadow-md transition-shadow w-full">
    <div>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
      <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white truncate">{value}</h3>
      {subtext && <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">{subtext}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} shrink-0 ml-4`}>
      <Icon size={24} />
    </div>
  </div>
);

const App: React.FC = () => {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [darkMode, setDarkMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [selectedOperator, setSelectedOperator] = useState<string>('Todos');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });

  useEffect(() => {
    const isDark = localStorage.getItem('theme') !== 'light';
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('theme', newMode ? 'dark' : 'light');
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsedData = parseCSV(text);
        
        if (parsedData.length === 0) {
          setError("O arquivo CSV parece vazio ou mal formatado. Verifique os delimitadores (; ou ,) e cabeçalhos.");
        } else {
          setAllTransactions(parsedData);
          // Reset filters on new upload
          setSelectedOperator('Todos');
          setDateRange({ start: '', end: '' });
        }
      } catch (err) {
        setError("Erro ao processar o arquivo. Certifique-se que é um CSV válido.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsText(file);
  };

  // Helper for preset date buttons
  const applyDatePreset = (preset: 'today' | 'month' | 'year' | 'all') => {
    const today = new Date();
    const end = today.toISOString().split('T')[0];
    let start = '';

    if (preset === 'today') {
        start = end;
    } else if (preset === 'month') {
        const d = new Date(today.getFullYear(), today.getMonth(), 1);
        start = d.toISOString().split('T')[0];
    } else if (preset === 'year') {
        const d = new Date(today.getFullYear(), 0, 1);
        start = d.toISOString().split('T')[0];
    } else {
        // All time
        start = ''; 
    }

    // For 'all', we clear both. For others, we set start/end.
    if (preset === 'all') {
        setDateRange({ start: '', end: '' });
    } else {
        setDateRange({ start, end });
    }
  };

  // Extract unique operators for dropdown
  const operators = useMemo(() => {
    const ops = new Set(allTransactions.map(t => t.operator));
    const sortedOps = Array.from(ops).sort();
    return ['Todos', ...sortedOps];
  }, [allTransactions]);

  // Filter transactions dynamically
  const filteredTransactions = useMemo(() => {
    return filterTransactions(allTransactions, selectedOperator, dateRange.start, dateRange.end);
  }, [allTransactions, selectedOperator, dateRange]);

  // Recalculate stats based on filtered data
  const stats = useMemo(() => {
    if (filteredTransactions.length === 0 && allTransactions.length === 0) return null;
    if (filteredTransactions.length === 0) return null; 
    return calculateStats(filteredTransactions);
  }, [filteredTransactions, allTransactions]);

  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-dark transition-colors duration-300 pb-20">
      {/* Navbar */}
      <nav className="bg-white dark:bg-dark-card border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <TrendingUp className="text-primary mr-2" size={28} />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">
                Wise Analyst
              </span>
            </div>
            <div className="flex items-center gap-4">
               {allTransactions.length > 0 && (
                <label className="cursor-pointer bg-primary hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2">
                  <Upload size={16} />
                  <span className="hidden sm:inline">Novo CSV</span>
                  <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
                </label>
               )}
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-yellow-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition"
                aria-label="Alternar tema"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {allTransactions.length === 0 ? (
          /* Empty State / Upload Screen */
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
             <div className="bg-white dark:bg-dark-card p-10 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-w-lg w-full">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileText className="text-primary" size={40} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Importar Dados Financeiros</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  Carregue seu arquivo CSV para gerar o dashboard. O sistema detecta colunas e separadores automaticamente.
                </p>
                
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-semibold">Clique para enviar</span> ou arraste e solte
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">CSV (Máx. 10MB)</p>
                  </div>
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
                </label>

                {loading && <p className="mt-4 text-primary animate-pulse">Processando dados...</p>}
                {error && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
             </div>
          </div>
        ) : (
          /* Dashboard Content */
          <div className="space-y-6 animate-fade-in w-full">
            
            {/* Filter Bar */}
            <div className="bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
              
              {/* Operator */}
              <div className="flex items-center gap-3 w-full xl:w-auto">
                 <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <Filter size={20} className="text-primary" />
                    <span className="font-semibold text-sm hidden sm:inline">Filtros:</span>
                 </div>
                 <div className="relative flex-grow sm:flex-grow-0">
                  <select 
                    value={selectedOperator}
                    onChange={(e) => setSelectedOperator(e.target.value)}
                    className="w-full sm:w-48 appearance-none bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2 px-4 pr-8 rounded-lg leading-tight focus:outline-none focus:border-primary transition-colors cursor-pointer text-sm"
                  >
                    {operators.map(op => (
                      <option key={op} value={op}>{op}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>

              {/* Date Filters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-start sm:items-center">
                
                {/* Inputs */}
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-slate-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
                   <Calendar size={16} className="ml-2 text-gray-400" />
                   <input 
                      type="date" 
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none p-1 w-32"
                   />
                   <span className="text-gray-400 text-xs">até</span>
                   <input 
                      type="date" 
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-transparent text-sm text-gray-700 dark:text-gray-200 focus:outline-none p-1 w-32"
                   />
                </div>

                {/* Presets */}
                <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                  <button onClick={() => applyDatePreset('today')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition">Hoje</button>
                  <button onClick={() => applyDatePreset('month')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition whitespace-nowrap">Este Mês</button>
                  <button onClick={() => applyDatePreset('year')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-gray-300 transition whitespace-nowrap">Este Ano</button>
                  <button onClick={() => applyDatePreset('all')} className="px-3 py-1.5 text-xs font-medium rounded-md bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition">Limpar</button>
                </div>

              </div>
            </div>

            {stats ? (
              <>
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  <KPICard 
                    title="Receita" 
                    value={formatCurrency(stats.totalRevenue)} 
                    icon={DollarSign} 
                    colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                  />
                  <KPICard 
                    title="Lucro" 
                    value={formatCurrency(stats.totalProfit)} 
                    icon={TrendingUp} 
                    colorClass="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  />
                  <KPICard 
                    title="Custos" 
                    value={formatCurrency(stats.totalCost)} 
                    icon={Activity} 
                    colorClass="bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
                  />
                  <KPICard 
                    title="Qtd. Vendas" 
                    value={stats.salesCount} 
                    icon={ShoppingCart} 
                    colorClass="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                  />
                  <KPICard 
                    title="Ticket Médio" 
                    value={formatCurrency(stats.avgTicket)} 
                    icon={Users} 
                    colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                  />
                </div>

                {/* Charts Row 1 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Evolução da Receita</h3>
                    <RevenueAreaChart data={stats.revenueOverTime} />
                  </div>
                  <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Divisão por Operadora</h3>
                    <GenericDonutChart data={stats.topOperators} />
                  </div>
                </div>

                {/* Charts Row 2 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Por Categoria</h3>
                    <GenericDonutChart data={stats.topCategories} />
                  </div>
                  <div className="lg:col-span-2 bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Top 10 Pacotes Vendidos</h3>
                    <TopPackagesBarChart data={stats.topPackages} />
                  </div>
                </div>
                
                {/* Status Chart */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-dark-card p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 lg:col-span-1">
                      <h3 className="text-lg font-semibold mb-6 text-gray-800 dark:text-white">Status das Transações</h3>
                      <GenericDonutChart data={stats.statusDistribution} isStatus />
                    </div>
                    <div className="lg:col-span-2 bg-transparent hidden lg:block">
                        {/* Spacer */}
                    </div>
                </div>

                {/* Top Clients & Transactions */}
                <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                  {/* Top Performers List */}
                  <div className="xl:col-span-1 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="p-5 border-b border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Top 5 Clientes</h3>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-gray-700">
                      {stats.topClients.map((client, idx) => (
                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                              {idx + 1}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{client.name}</p>
                              <p className="text-xs text-gray-500">{client.transactions} transações</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-2 whitespace-nowrap">{formatCurrency(client.totalSpent)}</span>
                        </div>
                      ))}
                      {stats.topClients.length === 0 && (
                        <div className="p-4 text-center text-gray-500 text-sm">Nenhum cliente neste período.</div>
                      )}
                    </div>
                  </div>

                  {/* Main Table */}
                  <div className="xl:col-span-3">
                    <TransactionTable data={filteredTransactions} />
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-20 bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">Sem dados para este filtro</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tente selecionar uma data ou operadora diferente.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;