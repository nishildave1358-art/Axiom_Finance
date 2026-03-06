import { TrendingUp, TrendingDown, DollarSign, AlertTriangle } from "lucide-react";

interface CashFlowHealthScoreProps {
  score?: number;
}

export function CashFlowHealthScore({ score = 85 }: CashFlowHealthScoreProps) {
  const displayScore = score;
  const trend = score >= 50 ? "up" : "down";

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-slate-400 text-sm">Cash Flow Health</div>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-2xl font-bold text-white">{displayScore}/100</div>
            {trend === "up" ? (
              <TrendingUp className="text-green-400" size={20} />
            ) : (
              <TrendingDown className="text-red-400" size={20} />
            )}
          </div>
        </div>
        <div className="p-3 bg-primary/10 rounded-xl">
          <DollarSign className="text-primary" size={24} />
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-slate-400">Health Score</span>
          <span className="text-white font-medium">
            {displayScore >= 80 ? "Excellent" :
              displayScore >= 60 ? "Good" :
                displayScore >= 40 ? "Fair" : "Poor"}
          </span>
        </div>
        <div className="w-full bg-slate-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${displayScore >= 80 ? "bg-green-500" :
              displayScore >= 60 ? "bg-yellow-500" :
                displayScore >= 40 ? "bg-orange-500" : "bg-red-500"
              }`}
            style={{ width: `${displayScore}%` }}
          ></div>
        </div>
      </div>

      <div className="mt-4 text-sm text-slate-400">
        {displayScore >= 80
          ? "Your cash flow is excellent! Keep up the good work."
          : displayScore >= 60
            ? "Your cash flow is good but could be improved."
            : "Consider reviewing your expenses to improve cash flow."}
      </div>
    </div>
  );
}