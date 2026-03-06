import express from "express";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? Number(process.env.PORT) : 8787;
const DATA_PATH = path.join(__dirname, "data.json");
const SESSION_COOKIE = "axiom_session";

function now() {
  return Date.now();
}

function readJsonFile(filePath, fallback) {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJsonFileAtomic(filePath, data) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(tmp, filePath);
}

function ensureDb() {
  const db = readJsonFile(DATA_PATH, null);
  if (db) return db;
  const initial = {
    meta: { createdAt: now() },
    users: [],
    sessions: [],
    transactions: [],
    goals: [],
    simulations: [],
  };
  writeJsonFileAtomic(DATA_PATH, initial);
  return initial;
}

function loadDb() {
  return ensureDb();
}

function saveDb(db) {
  writeJsonFileAtomic(DATA_PATH, db);
}

function randomId(prefix = "") {
  return `${prefix}${crypto.randomBytes(16).toString("hex")}`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function hashPassword(password, salt) {
  const s = salt ?? crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(String(password), s, 64);
  return { salt: s, hash: derivedKey.toString("hex") };
}

function verifyPassword(password, salt, expectedHash) {
  const derivedKey = crypto.scryptSync(String(password), String(salt), 64);
  const a = Buffer.from(derivedKey.toString("hex"), "hex");
  const b = Buffer.from(String(expectedHash), "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function createSession(db, userId) {
  const token = randomId("sess_");
  const expiresAt = now() + 30 * 24 * 60 * 60 * 1000;
  db.sessions.push({ id: randomId("s_") , token, userId, createdAt: now(), expiresAt });
  return { token, expiresAt };
}

function destroySession(db, token) {
  db.sessions = db.sessions.filter((s) => s.token !== token);
}

function getSession(db, token) {
  const sess = db.sessions.find((s) => s.token === token);
  if (!sess) return null;
  if (sess.expiresAt <= now()) {
    destroySession(db, token);
    return null;
  }
  return sess;
}

function sanitizeUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isGuest: user.isGuest,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
}

function getAuthedUser(db, req) {
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return null;
  const sess = getSession(db, token);
  if (!sess) return null;
  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) return null;
  return user;
}

function requireAuth(req, res, next) {
  const db = loadDb();
  const user = getAuthedUser(db, req);
  if (!user) return res.status(401).json({ error: "Not authenticated" });
  req._axiom = { db, user };
  return next();
}

function ensureSeedData(db, userId) {
  const hasAny = db.transactions.some((t) => t.userId === userId) || db.goals.some((g) => g.userId === userId);
  if (hasAny) return;

  const baseNow = now();
  db.transactions.push(
    {
      id: randomId("tx_"),
      userId,
      type: "income",
      amount: 800000,
      description: "Freelance Project Payment",
      category: "salary",
      date: baseNow - 2 * 86400000,
      tags: ["freelance"],
      createdAt: baseNow,
    },
    {
      id: randomId("tx_"),
      userId,
      type: "expense",
      amount: 250000,
      description: "Office Rent",
      category: "housing",
      date: baseNow - 3 * 86400000,
      tags: ["rent"],
      createdAt: baseNow,
    },
    {
      id: randomId("tx_"),
      userId,
      type: "expense",
      amount: 45000,
      description: "Software Subscription",
      category: "software",
      date: baseNow - 5 * 86400000,
      tags: ["subscription"],
      createdAt: baseNow,
    }
  );

  db.goals.push(
    {
      id: randomId("g_"),
      userId,
      name: "Emergency Fund",
      targetAmount: 1000000,
      currentAmount: 750000,
      targetDate: baseNow + 90 * 86400000,
      category: "savings",
      priority: "high",
      isActive: true,
      createdAt: baseNow,
    },
    {
      id: randomId("g_"),
      userId,
      name: "New Laptop",
      targetAmount: 150000,
      currentAmount: 50000,
      targetDate: baseNow + 30 * 86400000,
      category: "purchase",
      priority: "medium",
      isActive: true,
      createdAt: baseNow,
    }
  );
}

function monthKey(ts) {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(key) {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-US", { month: "short" });
}

function computeDashboard(db, userId) {
  const seedBaseBalance = 4250000;
  const txs = db.transactions.filter((t) => t.userId === userId);

  const incomeTotal = txs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expenseTotal = txs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalBalance = Math.max(0, seedBaseBalance + incomeTotal - expenseTotal);

  const lockedTaxReserve = Math.round(totalBalance * 0.25);
  const riskZoneCash = Math.round(totalBalance * 0.1);
  const futureCommittedCash = Math.round(totalBalance * 0.05);
  const availableCash = Math.max(0, totalBalance - lockedTaxReserve - riskZoneCash - futureCommittedCash);

  const nowTs = now();
  const last30Cutoff = nowTs - 30 * 86400000;
  const last30Expenses = txs
    .filter((t) => t.type === "expense" && t.date >= last30Cutoff)
    .reduce((s, t) => s + t.amount, 0);
  const monthlyBurnRate = Math.max(1, Math.round(last30Expenses || 350000));
  const runwayDays = Math.max(0, Math.round((availableCash / monthlyBurnRate) * 30));
  const riskLevel = runwayDays > 90 ? "healthy" : runwayDays > 45 ? "watch" : "critical";

  // Trend data for last 6 months
  const trendMap = new Map();
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const k = monthKey(d.getTime());
    trendMap.set(k, { income: 0, expenses: 0 });
  }
  for (const t of txs) {
    const k = monthKey(t.date);
    if (!trendMap.has(k)) continue;
    const entry = trendMap.get(k);
    if (t.type === "income") entry.income += t.amount;
    if (t.type === "expense") entry.expenses += t.amount;
  }

  // build a pseudo balance series from seedBaseBalance
  let running = seedBaseBalance;
  const trendData = Array.from(trendMap.entries()).map(([k, v]) => {
    running = Math.max(0, running + v.income - v.expenses);
    return {
      month: monthLabel(k),
      balance: running,
      income: v.income,
      expenses: v.expenses,
    };
  });

  // expense categories (top 5, last 30 days)
  const catMap = new Map();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    if (t.date < last30Cutoff) continue;
    const cat = t.category || "other";
    catMap.set(cat, (catMap.get(cat) || 0) + t.amount);
  }
  const expenseCategories = Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const analytics = {
    monthlyBurnRate,
    runwayDays,
    cashFlowScore: Math.max(10, Math.min(95, 30 + Math.round(runwayDays / 2))),
    expenseCategories,
    incomeSources: [
      { name: "Income", value: incomeTotal || 0 },
      { name: "Other", value: Math.max(0, incomeTotal * 0.1) },
    ],
    trendData,
  };

  const wallet = {
    totalBalance,
    availableCash,
    lockedTaxReserve,
    riskZoneCash,
    futureCommittedCash,
    runwayDays,
    riskLevel,
    currency: "INR",
    lastUpdated: nowTs,
  };

  return { wallet, analytics };
}

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "axiom-local-api", time: new Date().toISOString() });
});

app.get("/api/auth/me", (req, res) => {
  const db = loadDb();
  const token = req.cookies?.[SESSION_COOKIE];
  if (!token) return res.status(200).json({ user: null });

  const sess = getSession(db, token);
  if (!sess) {
    saveDb(db);
    return res.status(200).json({ user: null });
  }

  const user = db.users.find((u) => u.id === sess.userId);
  if (!user) {
    destroySession(db, token);
    saveDb(db);
    res.clearCookie(SESSION_COOKIE);
    return res.status(200).json({ user: null });
  }

  return res.status(200).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/guest", (_req, res) => {
  const db = loadDb();

  const user = {
    id: randomId("u_"),
    email: null,
    name: `Guest ${Math.floor(1000 + Math.random() * 9000)}`,
    isGuest: true,
    passwordSalt: null,
    passwordHash: null,
    createdAt: now(),
    lastLoginAt: now(),
  };

  db.users.push(user);

  const session = createSession(db, user.id);
  saveDb(db);

  res.cookie(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(session.expiresAt),
    path: "/",
  });

  return res.status(200).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/signup", (req, res) => {
  const db = loadDb();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");
  const name = String(req.body?.name || "").trim();

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!password || password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  if (!name) return res.status(400).json({ error: "Name is required" });

  const existing = db.users.find((u) => u.email === email);
  if (existing) return res.status(409).json({ error: "Email already in use" });

  const { salt, hash } = hashPassword(password);

  const user = {
    id: randomId("u_"),
    email,
    name,
    isGuest: false,
    passwordSalt: salt,
    passwordHash: hash,
    createdAt: now(),
    lastLoginAt: now(),
  };

  db.users.push(user);
  const session = createSession(db, user.id);
  saveDb(db);

  res.cookie(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(session.expiresAt),
    path: "/",
  });

  return res.status(200).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/login", (req, res) => {
  const db = loadDb();
  const email = normalizeEmail(req.body?.email);
  const password = String(req.body?.password || "");

  if (!email) return res.status(400).json({ error: "Email is required" });
  if (!password) return res.status(400).json({ error: "Password is required" });

  const user = db.users.find((u) => u.email === email);
  if (!user || user.isGuest) return res.status(401).json({ error: "Invalid email or password" });
  if (!user.passwordSalt || !user.passwordHash) return res.status(401).json({ error: "Invalid email or password" });

  const ok = verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Invalid email or password" });

  user.lastLoginAt = now();
  const session = createSession(db, user.id);
  saveDb(db);

  res.cookie(SESSION_COOKIE, session.token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    expires: new Date(session.expiresAt),
    path: "/",
  });

  return res.status(200).json({ user: sanitizeUser(user) });
});

app.post("/api/auth/logout", (req, res) => {
  const db = loadDb();
  const token = req.cookies?.[SESSION_COOKIE];
  if (token) destroySession(db, token);
  saveDb(db);
  res.clearCookie(SESSION_COOKIE, { path: "/" });
  return res.status(200).json({ ok: true });
});

app.get("/api/transactions", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);

  const range = String(req.query?.range || "month");
  const cutoff =
    range === "week"
      ? now() - 7 * 86400000
      : range === "quarter"
        ? now() - 90 * 86400000
        : range === "year"
          ? now() - 365 * 86400000
          : now() - 30 * 86400000;

  const items = db.transactions
    .filter((t) => t.userId === user.id && t.date >= cutoff)
    .sort((a, b) => b.date - a.date);

  saveDb(db);
  return res.status(200).json({ transactions: items });
});

app.get("/api/wallet/summary", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);
  const { wallet } = computeDashboard(db, user.id);
  saveDb(db);
  return res.status(200).json({ wallet });
});

app.get("/api/dashboard", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);
  const data = computeDashboard(db, user.id);
  saveDb(db);
  return res.status(200).json(data);
});

app.post("/api/transactions", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);

  const type = String(req.body?.type || "expense");
  const amount = Number(req.body?.amount);
  const description = String(req.body?.description || "").trim();
  const category = String(req.body?.category || "other");
  const date = Number(req.body?.date || now());
  const tags = Array.isArray(req.body?.tags) ? req.body.tags.map((t) => String(t)).filter(Boolean) : [];

  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be a positive number" });
  if (!description) return res.status(400).json({ error: "Description is required" });
  if (type !== "income" && type !== "expense" && type !== "transfer") return res.status(400).json({ error: "Invalid transaction type" });

  const tx = {
    id: randomId("tx_"),
    userId: user.id,
    type,
    amount,
    description,
    category,
    date,
    tags,
    createdAt: now(),
  };

  db.transactions.push(tx);
  saveDb(db);
  return res.status(200).json({ transaction: tx });
});

app.delete("/api/transactions/:id", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  const id = String(req.params.id);
  const before = db.transactions.length;
  db.transactions = db.transactions.filter((t) => !(t.userId === user.id && t.id === id));
  if (db.transactions.length === before) return res.status(404).json({ error: "Transaction not found" });
  saveDb(db);
  return res.status(200).json({ ok: true });
});

app.get("/api/goals", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);
  const items = db.goals.filter((g) => g.userId === user.id).sort((a, b) => b.createdAt - a.createdAt);
  saveDb(db);
  return res.status(200).json({ goals: items });
});

app.post("/api/goals", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);

  const name = String(req.body?.name || "").trim();
  const targetAmount = Number(req.body?.targetAmount);
  const targetDate = Number(req.body?.targetDate);
  const category = String(req.body?.category || "savings");
  const priority = String(req.body?.priority || "medium");

  if (!name) return res.status(400).json({ error: "Name is required" });
  if (!Number.isFinite(targetAmount) || targetAmount <= 0) return res.status(400).json({ error: "Target amount must be a positive number" });
  if (!Number.isFinite(targetDate)) return res.status(400).json({ error: "Target date is required" });

  const goal = {
    id: randomId("g_"),
    userId: user.id,
    name,
    targetAmount,
    currentAmount: 0,
    targetDate,
    category,
    priority,
    isActive: true,
    createdAt: now(),
  };

  db.goals.push(goal);
  saveDb(db);
  return res.status(200).json({ goal });
});

app.post("/api/goals/:id/contribute", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  const id = String(req.params.id);
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) return res.status(400).json({ error: "Amount must be a positive number" });

  const goal = db.goals.find((g) => g.userId === user.id && g.id === id);
  if (!goal) return res.status(404).json({ error: "Goal not found" });

  goal.currentAmount = Number(goal.currentAmount || 0) + amount;
  saveDb(db);
  return res.status(200).json({ goal });
});

app.delete("/api/goals/:id", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  const id = String(req.params.id);
  const before = db.goals.length;
  db.goals = db.goals.filter((g) => !(g.userId === user.id && g.id === id));
  if (db.goals.length === before) return res.status(404).json({ error: "Goal not found" });
  saveDb(db);
  return res.status(200).json({ ok: true });
});

app.post("/api/simulations/run", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);

  const changes = Array.isArray(req.body?.changes) ? req.body.changes : [];
  const baselineRunway = 73;
  const baselineBalance = 4250000;
  let delta = 0;
  for (const c of changes) {
    const amt = Number(c?.amount);
    if (!Number.isFinite(amt)) continue;
    const type = String(c?.type || "income");
    delta += type === "expense" ? -amt : amt;
  }

  const projectedBalance = Math.max(0, baselineBalance + delta);
  const runwayDeltaDays = Math.round(delta / 30000);
  const newRunway = Math.max(0, baselineRunway + runwayDeltaDays);
  const impact = `${runwayDeltaDays >= 0 ? "+" : ""}${runwayDeltaDays} days`;

  const run = {
    id: randomId("sim_"),
    userId: user.id,
    createdAt: now(),
    changes: changes.map((c) => ({
      id: randomId("c_"),
      type: String(c?.type || "income"),
      category: String(c?.category || ""),
      amount: Number(c?.amount) || 0,
    })),
    results: {
      originalRunway: baselineRunway,
      newRunway,
      impact,
      projectedBalance,
    },
  };

  db.simulations.push(run);
  saveDb(db);
  return res.status(200).json({ results: run.results, runId: run.id });
});

app.get("/api/simulations", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  ensureSeedData(db, user.id);
  const items = db.simulations
    .filter((s) => s.userId === user.id)
    .sort((a, b) => b.createdAt - a.createdAt);
  saveDb(db);
  return res.status(200).json({ simulations: items });
});

app.delete("/api/simulations/:id", requireAuth, (req, res) => {
  const { db, user } = req._axiom;
  const id = String(req.params.id);
  const before = db.simulations.length;
  db.simulations = db.simulations.filter((s) => !(s.userId === user.id && s.id === id));
  if (db.simulations.length === before) return res.status(404).json({ error: "Simulation not found" });
  saveDb(db);
  return res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`[axiom-local-api] listening on http://localhost:${PORT}`);
});
