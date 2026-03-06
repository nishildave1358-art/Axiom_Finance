import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Bell,
  MoreHorizontal,
  Search,
} from "lucide-react";
import { formatCurrency, smartFormat } from "../lib/utils";
import { useCurrency } from "../lib/useCurrency";

type WalletSummary = {
  totalBalance: number;
  availableCash: number;
  lockedTaxReserve: number;
  riskZoneCash: number;
  futureCommittedCash: number;
  runwayDays: number;
  riskLevel: string;
  currency: string;
  lastUpdated: number;
};

type TrendPoint = {
  name: string;
  revenue: number;
  expenses: number;
  prediction: number;
};

type TrendingSector = {
  name: string;
  value: number;
  deltaPct: number;
};

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}

function ringDash(progress01: number, radius: number) {
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * clamp01(progress01);
  const empty = circumference - filled;
  return { circumference, dash: `${filled} ${empty}` };
}

function formatSignedPct(n: number) {
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

function TrendingSectors({ sectors }: { sectors: TrendingSector[] }) {
  const data = sectors.map((s) => ({ name: s.name, value: s.value }));
  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-bold">Trending Sectors</div>
          <div className="text-xs text-slate-400 mt-1">Market heatmap snapshot</div>
        </div>
        <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <MoreHorizontal size={18} className="text-slate-300" />
        </button>
      </div>

      <div className="mt-4 h-[170px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0b0f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
              labelStyle={{ color: "#fff" }}
              itemStyle={{ color: "#CCFF00" }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="rgba(204,255,0,0.75)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {sectors.slice(0, 4).map((s) => (
          <div key={s.name} className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-xs text-slate-400">{s.name}</div>
            <div className="text-white font-bold mt-1">{s.value.toFixed(2)}</div>
            <div className={`text-xs mt-1 ${s.deltaPct >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {formatSignedPct(s.deltaPct)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressRing({ value, total }: { value: number; total: number }) {
  const pct = total <= 0 ? 0 : value / total;
  const radius = 56;
  const { dash } = ringDash(pct, radius);

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-white font-bold">Current Round</div>
          <div className="text-xs text-slate-400 mt-1">Initialised</div>
        </div>
        <button type="button" className="p-2 rounded-lg hover:bg-white/5 transition-colors">
          <MoreHorizontal size={18} className="text-slate-300" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
        <div className="flex items-center justify-center">
          <svg width="150" height="150" viewBox="0 0 150 150" className="drop-shadow-[0_0_22px_rgba(204_255_0_0.18)]">
            <g transform="translate(75,75) rotate(-90)">
              <circle r={radius} cx="0" cy="0" fill="transparent" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
              <circle
                r={radius}
                cx="0"
                cy="0"
                fill="transparent"
                stroke="rgba(204,255,0,0.9)"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={dash}
              />
            </g>
            <text x="75" y="72" textAnchor="middle" className="fill-white" fontSize="26" fontWeight="800">
              {value}
            </text>
            <text x="75" y="94" textAnchor="middle" className="fill-slate-400" fontSize="12" fontWeight="600">
              of {total} Blocks
            </text>
          </svg>
        </div>

        <div className="space-y-3">
          {[
            { label: "Fees", value: "0.13 ETH", color: "bg-amber-300" },
            { label: "Rewards", value: "18129 LPT", color: "bg-primary" },
            { label: "Staked", value: "34,532", color: "bg-emerald-400" },
            { label: "Supply", value: "$12.5B", color: "bg-sky-400" },
          ].map((row) => (
            <div key={row.label} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2">
              <div className="flex items-center gap-2">
                <div className={`h-2.5 w-2.5 rounded-full ${row.color}`} />
                <div className="text-xs text-slate-300">{row.label}</div>
              </div>
              <div className="text-xs font-bold text-white">{row.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NeonOverview({
  greeting,
  userName,
  wallet,
  trend,
}: {
  greeting: string;
  userName: string;
  wallet: WalletSummary;
  trend: TrendPoint[];
}) {
  const { currency } = useCurrency();

  const sectors: TrendingSector[] = useMemo(
    () => [
      { name: "Memes", value: 8.7, deltaPct: 2.1 },
      { name: "AI", value: 4.23, deltaPct: 1.4 },
      { name: "Privacy", value: 4.23, deltaPct: -3.0 },
      { name: "PEPE", value: 4.23, deltaPct: 1.6 },
      { name: "L2", value: 6.11, deltaPct: 0.9 },
      { name: "RWA", value: 5.02, deltaPct: -0.6 },
      { name: "DeFi", value: 7.31, deltaPct: 1.2 },
    ],
    []
  );

  const kpiA = formatCurrency(wallet.totalBalance, currency);
  const kpiB = smartFormat(wallet.availableCash, currency);

  return (
    <div className="p-4 sm:p-6 pb-24">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="text-slate-400 text-sm">{greeting}</div>
            <h1 className="text-white text-2xl sm:text-3xl font-black tracking-tight">Overview, {userName}</h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2">
              <Search size={16} className="text-slate-400" />
              <input
                className="bg-transparent outline-none text-sm text-slate-200 w-44"
                placeholder="Search assets, reports…"
              />
            </div>
            <button type="button" className="h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Bell size={18} className="text-slate-300" />
            </button>
            <button type="button" className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10 transition-colors">
              Reserve Wallet
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-slate-400 text-xs">Estimated Usage</div>
                <div className="text-white text-2xl sm:text-3xl font-black mt-1">{kpiA}</div>
                <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-slate-300">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Last Week
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">Today</div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">Last Week</div>
                <div className="hidden sm:block rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300">Last Month</div>
              </div>
            </div>

            <div className="mt-4 h-[260px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="axiomNeon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#CCFF00" stopOpacity={0.35} />
                      <stop offset="85%" stopColor="#CCFF00" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis stroke="#64748b" tickLine={false} axisLine={false} fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0b0f14", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px" }}
                    itemStyle={{ color: "#fff" }}
                    labelStyle={{ color: "#94a3b8" }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#CCFF00" strokeWidth={3} fill="url(#axiomNeon)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] text-slate-500">Available</div>
                <div className="text-sm font-bold text-white">{kpiB}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] text-slate-500">Runway</div>
                <div className="text-sm font-bold text-white">{wallet.runwayDays} days</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                <div className="text-[10px] text-slate-500">Risk</div>
                <div className="text-sm font-bold text-white capitalize">{wallet.riskLevel}</div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <TrendingSectors sectors={sectors} />
          </div>
          <ProgressRing value={4134} total={4377} />
        </div>
      </div>
    </div>
  );
}
