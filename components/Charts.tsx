import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { formatCurrency } from '../utils/helpers';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS: Record<string, string> = {
  'Pago': '#10b981', // Green
  'Pendente': '#f59e0b', // Amber
  'Falha': '#ef4444', // Red
};

interface RevenueChartProps {
  data: Array<{ date: string; value: number; profit: number }>;
}

export const RevenueAreaChart: React.FC<RevenueChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="date" 
            stroke="#94a3b8" 
            tickFormatter={(str) => {
              const d = new Date(str);
              return `${d.getDate()}/${d.getMonth()+1}`;
            }}
            tick={{fontSize: 12}}
            tickMargin={10}
          />
          <YAxis 
            stroke="#94a3b8" 
            tickFormatter={(val) => `MT ${val}`} 
            tick={{fontSize: 11}}
            width={65}
          />
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
            formatter={(value: number) => formatCurrency(value)}
          />
          <Area type="monotone" dataKey="value" name="Receita" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRevenue)" />
          <Area type="monotone" dataKey="profit" name="Lucro" stroke="#10b981" fillOpacity={1} fill="url(#colorProfit)" />
          <Legend wrapperStyle={{ paddingTop: '10px' }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

interface PackageBarChartProps {
  data: Array<{ name: string; value: number }>;
}

export const TopPackagesBarChart: React.FC<PackageBarChartProps> = ({ data }) => {
  return (
    <div className="h-72 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
          <XAxis type="number" stroke="#94a3b8" tick={{fontSize: 12}} />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#94a3b8" 
            width={100} 
            style={{ fontSize: '11px' }} 
            interval={0}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
            cursor={{fill: '#334155', opacity: 0.2}}
          />
          <Bar dataKey="value" name="Vendas" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

interface DonutChartProps {
  data: Array<{ name: string; value: number }>;
  isStatus?: boolean;
}

export const GenericDonutChart: React.FC<DonutChartProps> = ({ data, isStatus = false }) => {
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            fill="#8884d8"
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={isStatus 
                  ? (STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]) 
                  : COLORS[index % COLORS.length]
                } 
              />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f1f5f9', fontSize: '12px' }}
          />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};