import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell 
} from 'recharts';
import { TrendingUp, DollarSign, ShoppingCart, Activity } from 'lucide-react';

const data = [
  { name: 'Jan', sales: 4000, profit: 2400 },
  { name: 'Fev', sales: 3000, profit: 1398 },
  { name: 'Mar', sales: 2000, profit: 9800 },
  { name: 'Abr', sales: 2780, profit: 3908 },
  { name: 'Mai', sales: 1890, profit: 4800 },
  { name: 'Jun', sales: 2390, profit: 3800 },
  { name: 'Jul', sales: 3490, profit: 4300 },
];

const categoryData = [
  { name: 'Casa', value: 400 },
  { name: 'Eletrônicos', value: 300 },
  { name: 'Beleza', value: 300 },
  { name: 'Pet', value: 200 },
];

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74'];

const StatCard: React.FC<{ title: string; value: string; trend: string; icon: React.ReactNode; isPositive?: boolean }> = ({ 
  title, value, trend, icon, isPositive = true 
}) => (
  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-brand-50 rounded-lg text-brand-600">
        {icon}
      </div>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {trend}
      </span>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
    <p className="text-2xl font-bold text-gray-900">{value}</p>
  </div>
);

export const ProfitAnalytics: React.FC = () => {
  return (
    <div className="space-y-6 overflow-y-auto pb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Receita Total" 
          value="€ 14.502,30" 
          trend="+12.5%" 
          icon={<DollarSign className="w-5 h-5" />} 
        />
        <StatCard 
          title="Lucro Líquido" 
          value="€ 4.205,10" 
          trend="+8.2%" 
          icon={<TrendingUp className="w-5 h-5" />} 
        />
        <StatCard 
          title="Vendas (Unidades)" 
          value="842" 
          trend="+5.1%" 
          icon={<ShoppingCart className="w-5 h-5" />} 
        />
        <StatCard 
          title="Margem Média" 
          value="28.9%" 
          trend="-1.2%" 
          isPositive={false}
          icon={<Activity className="w-5 h-5" />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Performance de Vendas vs Lucro</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ea580c" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#ea580c" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Area type="monotone" dataKey="sales" stroke="#ea580c" fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="profit" stroke="#334155" fillOpacity={0.1} fill="#334155" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6">Vendas por Categoria</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 flex-wrap mt-4">
              {categoryData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                  <span className="text-xs text-gray-600">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};