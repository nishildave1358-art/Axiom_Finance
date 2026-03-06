import { formatCurrency } from "../lib/utils";
import { TrendingUp, TrendingDown, Calendar, AlertTriangle } from "lucide-react";

// Mock data
const mockTimeline = [
  { month: "Jan", balance: 4250000, income: 2500000, expenses: 350000, events: [] },
  { month: "Feb", balance: 4400000, income: 2300000, expenses: 350000, events: [] },
  { month: "Mar", balance: 4600000, income: 2600000, expenses: 400000, events: [] },
  { month: "Apr", balance: 4800000, income: 2800000, expenses: 450000, events: [] },
  { month: "May", balance: 5000000, income: 3000000, expenses: 500000, events: [] },
  { month: "Jun", balance: 5200000, income: 3200000, expenses: 550000, events: [{ type: "payment", description: "Tax Payment Due" }] },
];

const mockCriticalDates = [
  { date: new Date(Date.now() + 15 * 86400000), title: "Tax Payment Due", amount: 250000, type: "payment" },
  { date: new Date(Date.now() + 45 * 86400000), title: "Invoice Due", amount: 1500000, type: "income" },
];

export function FinancialTimeline() {
  const timeline = mockTimeline;
  const criticalDates = mockCriticalDates;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Financial Timeline</h2>
        <p className="text-slate-400 mt-1">Projected cash flow and important dates</p>
      </div>

      {/* Critical Dates */}
      {criticalDates.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="font-semibold text-white mb-3">Upcoming Critical Dates</h3>
          <div className="space-y-3">
            {criticalDates.map((event, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {event.type === "income" ? (
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingUp className="text-green-400" size={16} />
                    </div>
                  ) : (
                    <div className="p-2 bg-red-500/10 rounded-lg">
                      <TrendingDown className="text-red-400" size={16} />
                    </div>
                  )}
                  <div>
                    <div className="font-medium text-white">{event.title}</div>
                    <div className="text-sm text-slate-400">
                      {event.date.toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className={`font-medium ${
                  event.type === "income" ? "text-green-400" : "text-red-400"
                }`}>
                  {event.type === "income" ? "+" : "-"}
                  {formatCurrency(event.amount, "INR")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="glass-card rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">6-Month Projection</h3>
        <div className="space-y-4">
          {timeline.map((point, index) => (
            <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-full bg-primary/20 mt-1"></div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-white">{point.month}</div>
                  <div className="text-white font-medium">
                    {formatCurrency(point.balance, "INR")}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1 text-green-400">
                    <TrendingUp size={14} />
                    {formatCurrency(point.income, "INR")}
                  </div>
                  <div className="flex items-center gap-1 text-red-400">
                    <TrendingDown size={14} />
                    {formatCurrency(point.expenses, "INR")}
                  </div>
                </div>
                
                {point.events.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {point.events.map((event, eventIndex) => (
                      <div key={eventIndex} className="flex items-center gap-1 text-xs px-2 py-1 bg-yellow-500/10 text-yellow-400 rounded">
                        <AlertTriangle size={12} />
                        {event.description}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}