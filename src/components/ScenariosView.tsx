import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Trash2, RefreshCcw, Wand2, FileDown } from "lucide-react";
import { apiJson } from "../lib/api";
import { formatCurrency } from "../lib/utils";

type SimulationChange = {
  id: string;
  type: string;
  category: string;
  amount: number;
};

type SimulationRun = {
  id: string;
  userId: string;
  createdAt: number;
  changes: SimulationChange[];
  results: {
    originalRunway: number;
    newRunway: number;
    impact: string;
    projectedBalance: number;
  };
};

export function ScenariosView() {
  const [items, setItems] = useState<SimulationRun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = async () => {
    const data = await apiJson<{ simulations: SimulationRun[] }>("/api/simulations");
    setItems(data.simulations);
  };

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        setIsLoading(true);
        const data = await apiJson<{ simulations: SimulationRun[] }>("/api/simulations");
        if (mounted) setItems(data.simulations);
      } catch (e: any) {
        toast.error(e?.message || "Failed to load scenarios");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const exportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `axiom-simulations.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success("Exported JSON");
    } catch (e: any) {
      toast.error(e?.message || "Export failed");
    }
  };

  const summary = useMemo(() => {
    const count = items.length;
    const avgDelta = count
      ? items.reduce((s, r) => s + (r.results.newRunway - r.results.originalRunway), 0) / count
      : 0;
    const best = items.reduce((acc, r) => {
      const d = r.results.newRunway - r.results.originalRunway;
      if (!acc) return { id: r.id, delta: d };
      return d > acc.delta ? { id: r.id, delta: d } : acc;
    }, null as null | { id: string; delta: number });

    return {
      count,
      avgDelta,
      bestDelta: best?.delta ?? 0,
    };
  }, [items]);

  const onDelete = async (id: string) => {
    try {
      await apiJson<{ ok: true }>(`/api/simulations/${encodeURIComponent(id)}`, { method: "DELETE" });
      setItems((prev) => prev.filter((x) => x.id !== id));
      toast.success("Scenario deleted");
    } catch (e: any) {
      toast.error(e?.message || "Delete failed");
    }
  };

  const rerun = async (run: SimulationRun) => {
    try {
      const data = await apiJson<{ results: SimulationRun["results"]; runId: string }>("/api/simulations/run", {
        method: "POST",
        body: JSON.stringify({
          changes: run.changes.map((c) => ({ type: c.type, category: c.category, amount: c.amount })),
        }),
      });
      toast.success(`Re-run saved (Δ runway: ${data.results.impact})`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || "Re-run failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Scenarios</h1>
          <p className="text-slate-400 mt-1">Saved simulation runs stored locally on your machine</p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                try {
                  setIsLoading(true);
                  await load();
                  toast.success("Refreshed");
                } catch (e: any) {
                  toast.error(e?.message || "Refresh failed");
                } finally {
                  setIsLoading(false);
                }
              })();
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <RefreshCcw size={16} />
            Refresh
          </button>

          <button
            type="button"
            onClick={exportJson}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white hover:bg-white/10 transition-colors"
          >
            <FileDown size={16} />
            Export JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-slate-400">Saved runs</div>
          <div className="text-2xl font-bold text-white mt-1">{summary.count}</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-slate-400">Avg runway delta</div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary.avgDelta >= 0 ? "+" : ""}
            {summary.avgDelta.toFixed(1)} days
          </div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="text-xs text-slate-400">Best runway delta</div>
          <div className="text-2xl font-bold text-white mt-1">
            {summary.bestDelta >= 0 ? "+" : ""}
            {summary.bestDelta.toFixed(0)} days
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-slate-400">Loading scenarios…</div>
        ) : items.length === 0 ? (
          <div className="p-6 text-slate-400">No saved scenarios yet. Run a simulation to create one.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="text-left p-4 text-slate-400 font-normal">Created</th>
                  <th className="text-left p-4 text-slate-400 font-normal">Changes</th>
                  <th className="text-left p-4 text-slate-400 font-normal">Runway</th>
                  <th className="text-left p-4 text-slate-400 font-normal">Projected Balance</th>
                  <th className="text-right p-4 text-slate-400 font-normal">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((run) => {
                  const delta = run.results.newRunway - run.results.originalRunway;
                  return (
                    <tr key={run.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-4 text-slate-300">
                        {new Date(run.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{run.changes.length} changes</div>
                        <div className="text-xs text-slate-400 mt-1">
                          {run.changes.slice(0, 2).map((c) => (
                            <span key={c.id} className="inline-block mr-2">
                              {c.type === "expense" ? "-" : "+"}{formatCurrency(c.amount, "INR")} {c.category}
                            </span>
                          ))}
                          {run.changes.length > 2 ? <span>…</span> : null}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-bold">
                          {run.results.newRunway}d
                          <span className={`ml-2 text-xs ${delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            ({delta >= 0 ? "+" : ""}{delta}d)
                          </span>
                        </div>
                        <div className="text-xs text-slate-400">from {run.results.originalRunway}d</div>
                      </td>
                      <td className="p-4 text-white font-bold">
                        {formatCurrency(run.results.projectedBalance, "INR")}
                      </td>
                      <td className="p-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              void rerun(run);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-colors"
                          >
                            <Wand2 size={16} />
                            Re-run
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              void onDelete(run.id);
                            }}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-slate-200 hover:bg-red-500/10 hover:text-red-300 transition-colors"
                          >
                            <Trash2 size={16} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white font-bold">Pro Tip</div>
            <div className="text-slate-400 text-sm mt-1">Use scenarios to compare multiple ideas before committing to a plan.</div>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Wand2 size={18} />
            <span className="text-xs">Local-first</span>
          </div>
        </div>
      </div>
    </div>
  );
}
