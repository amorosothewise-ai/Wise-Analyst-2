import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, SortField, SortDirection } from '../types';
import { formatCurrency } from '../utils/helpers';
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
  data: Transaction[];
}

const ROWS_PER_PAGE = 10;

export const TransactionTable: React.FC<Props> = ({ data }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(SortField.DATE);
  const [sortDirection, setSortDirection] = useState<SortDirection>(SortDirection.DESC);

  // Reset to first page when data changes (e.g., filters applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === SortDirection.ASC ? SortDirection.DESC : SortDirection.ASC);
    } else {
      setSortField(field);
      setSortDirection(SortDirection.DESC); 
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 text-gray-400" />;
    return sortDirection === SortDirection.ASC 
      ? <ArrowUp size={14} className="ml-1 text-primary" /> 
      : <ArrowDown size={14} className="ml-1 text-primary" />;
  };

  const filteredAndSortedData = useMemo(() => {
    let result = data.filter(t => 
      t.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.package.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle strings case insensitive
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === SortDirection.ASC ? -1 : 1;
      if (valA > valB) return sortDirection === SortDirection.ASC ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedData.length / ROWS_PER_PAGE);
  const paginatedData = filteredAndSortedData.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );

  const getStatusColor = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'pago') return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (s === 'falha') return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header & Controls */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Histórico de Transações</h3>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-10 pr-4 py-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="bg-gray-50 dark:bg-slate-800 text-gray-700 dark:text-gray-200 uppercase font-medium">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition" onClick={() => handleSort(SortField.DATE)}>
                <div className="flex items-center">Data {getSortIcon(SortField.DATE)}</div>
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition" onClick={() => handleSort(SortField.CLIENT)}>
                 <div className="flex items-center">Cliente {getSortIcon(SortField.CLIENT)}</div>
              </th>
              <th className="px-6 py-3">Pacote</th>
              <th className="px-6 py-3">Categoria</th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition" onClick={() => handleSort(SortField.SALE_VALUE)}>
                 <div className="flex items-center justify-end">Valor {getSortIcon(SortField.SALE_VALUE)}</div>
              </th>
              <th className="px-6 py-3 text-right cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition" onClick={() => handleSort(SortField.PROFIT)}>
                 <div className="flex items-center justify-end">Lucro {getSortIcon(SortField.PROFIT)}</div>
              </th>
              <th className="px-6 py-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {paginatedData.length > 0 ? (
              paginatedData.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">{t.date}</td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{t.client}</td>
                  <td className="px-6 py-4">{t.package}</td>
                  <td className="px-6 py-4 text-xs">
                     <span className="bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 px-2 py-1 rounded">
                      {t.category}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">{formatCurrency(t.saleValue)}</td>
                  <td className="px-6 py-4 text-right text-emerald-600 dark:text-emerald-400 font-bold">
                    {formatCurrency(t.profit)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                  Nenhuma transação encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Mostrando <span className="font-medium">{(currentPage - 1) * ROWS_PER_PAGE + 1}</span> a <span className="font-medium">{Math.min(currentPage * ROWS_PER_PAGE, filteredAndSortedData.length)}</span> de <span className="font-medium">{filteredAndSortedData.length}</span> resultados
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};