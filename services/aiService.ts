import { Transaction, DashboardStats } from "../types";

export const generateAIReport = async (stats: DashboardStats, _transactions: Transaction[]) => {
  try {
    const response = await fetch('/api/ai/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stats })
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data.text || "Não foi possível obter uma resposta clara.";
  } catch (error) {
    console.error("AI Report Error:", error);
    return "Desculpe, não foi possível gerar o relatório no momento. Verifique sua conexão ou tente novamente mais tarde.";
  }
};

export const chatWithAI = async (message: string, stats: DashboardStats, _transactions: Transaction[], history: { role: 'user' | 'model', text: string }[]) => {
  try {
    const response = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, stats, history })
    });
    
    if (!response.ok) throw new Error('Network response was not ok');
    
    const data = await response.json();
    return data.text || "Não consegui processar sua mensagem.";
  } catch (error) {
    console.error("AI Chat Error:", error);
    return "Ops! Tive um problema ao processar sua pergunta. Pode repetir?";
  }
};
