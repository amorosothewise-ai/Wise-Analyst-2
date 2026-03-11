import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/ai/report", async (req, res) => {
    try {
      const { stats } = req.body;
      
      const model = "gemini-3-flash-preview";
      
      // Fix Token Bloat: Truncate large arrays
      const cleanStats = {
        ...stats,
        topClients: stats.topClients?.slice(0, 10) || [],
        topPackages: stats.topPackages?.slice(0, 10) || [],
        revenueOverTime: stats.revenueOverTime?.length > 30 
          ? "Dados diários omitidos por brevidade. Foco nas métricas agregadas." 
          : stats.revenueOverTime
      };

      const prompt = `
        Você é um analista financeiro sênior especializado em explicar dados para pessoas que não entendem de finanças.
        Analise os seguintes dados de vendas e crie um relatório detalhado, porém simples e fácil de entender.
        
        DADOS DO DASHBOARD (JSON):
        ${JSON.stringify(cleanStats, null, 2)}
        
        ESTRUTURA DO RELATÓRIO:
        1. Resumo Executivo (O que aconteceu no período?)
        2. Saúde Financeira (Estamos ganhando dinheiro? O lucro é bom? Qual a margem?)
        3. Comportamento dos Clientes (Quem são nossos melhores clientes e o que eles gostam?)
        4. Recomendações (O que devemos fazer para melhorar as vendas e o lucro?)
        5. Previsões (O que esperar para o próximo mês com base na tendência?)
        
        Use uma linguagem amigável, evite termos técnicos complicados ou explique-os se necessário. Formate a resposta em Markdown bem estruturado, com títulos, listas e negritos onde apropriado.
      `;

      const response = await ai.models.generateContent({
        model,
        contents: [{ parts: [{ text: prompt }] }],
      });
      
      res.json({ text: response.text || "Não foi possível obter uma resposta clara." });
    } catch (error) {
      console.error("AI Report Error:", error);
      res.status(500).json({ error: "Erro ao gerar relatório" });
    }
  });

  app.post("/api/ai/chat", async (req, res) => {
    try {
      const { message, stats, history } = req.body;
      
      const model = "gemini-3-flash-preview";
      
      // Fix Token Bloat
      const cleanStats = {
        ...stats,
        topClients: stats.topClients?.slice(0, 10) || [],
        topPackages: stats.topPackages?.slice(0, 10) || [],
        revenueOverTime: stats.revenueOverTime?.length > 30 
          ? "Dados diários omitidos por brevidade." 
          : stats.revenueOverTime
      };

      const context = `
        Você é o "Wise Assistant", um assistente inteligente integrado a um dashboard de vendas.
        Você tem acesso aos dados atuais do negócio e deve responder perguntas de forma clara, precisa e analítica.
        
        DADOS ATUAIS DO DASHBOARD (JSON):
        ${JSON.stringify(cleanStats, null, 2)}
        
        Responda em Português. Seja direto, mas educado. Se o usuário perguntar algo que não está nos dados, admita que não tem essa informação. Formate suas respostas em Markdown para facilitar a leitura.
      `;

      const chat = ai.chats.create({
        model,
        config: {
          systemInstruction: context,
        },
        history: history.map((h: any) => ({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] })),
      });

      const response = await chat.sendMessage({ message });
      res.json({ text: response.text || "Não consegui processar sua mensagem." });
    } catch (error) {
      console.error("AI Chat Error:", error);
      res.status(500).json({ error: "Erro ao processar chat" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

startServer();
