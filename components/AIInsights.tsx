import React, { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import { Sparkles, RefreshCw, FileText, BrainCircuit } from 'lucide-react';
import { generateAIReport } from '../services/aiService';
import { DashboardStats, Transaction } from '../types';

interface Props {
  stats: DashboardStats;
  transactions: Transaction[];
}

export const AIInsights: React.FC<Props> = ({ stats, transactions }) => {
  const [report, setReport] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGenerateReport = async () => {
    setLoading(true);
    const result = await generateAIReport(stats, transactions);
    setReport(result);
    setLoading(false);
  };

  useEffect(() => {
    if (stats && !report) {
      handleGenerateReport();
    }
  }, [stats]);

  return (
    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Relatório Inteligente (IA)</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Análise detalhada para não-especialistas</p>
          </div>
        </div>
        <button 
          onClick={handleGenerateReport}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <Sparkles size={18} />}
          <span className="text-sm font-semibold">{loading ? 'Analisando...' : 'Atualizar Análise'}</span>
        </button>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={24} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 animate-pulse font-medium">O Wise Analyst está processando seus dados...</p>
          </div>
        ) : report ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div className="markdown-body">
              <Markdown>{report}</Markdown>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">Clique em "Atualizar Análise" para gerar o relatório.</p>
          </div>
        )}
      </div>
    </div>
  );
};
