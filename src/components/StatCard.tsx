import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  positive: boolean;
  icon: React.ComponentType<{ size?: number; className?: string }>;
}

export function StatCard({ title, value, change, positive, icon: Icon }: StatCardProps) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${positive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
          <Icon className={positive ? 'text-green-400' : 'text-red-400'} size={20} />
        </div>
      </div>
      <div className={`flex items-center mt-3 text-sm ${positive ? 'text-green-400' : 'text-red-400'}`}>
        {positive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
        <span className="ml-1">{change}</span>
      </div>
    </div>
  );
}