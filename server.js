import express from "express";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Sesión en memoria (para producción considera un store externo)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "cambia_esto",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 8 } // 8h
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// --- Datos en memoria ---
let clicks = []; // {type, target, meta, created_at}

// --- Middleware ---
function requireAdmin(req, res, next) {
  if (req.session?.user?.is_admin) return next();
  res.status(401).json({ ok: false, error: "No autorizado" });
}

// --- API ---
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {
    req.session.user = { username, is_admin: true };
    return res.json({ ok: true, user: { username, is_admin: true } });
  }
  res.status(401).json({ ok: false, error: "Credenciales inválidas" });
});

app.post("/api/logout", (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

app.get("/api/me", (req, res) => {
  res.json({ ok: true, user: req.session?.user || null });
});

app.post("/api/track", (req, res) => {
  const { type, target, meta } = req.body || {};
  if (!type || !target)
    return res.status(400).json({ ok: false, error: "Falta type o target" });
  clicks.push({
    type,
    target,
    meta,
    created_at: new Date().toISOString()
  });
  res.json({ ok: true });
});

app.get("/api/stats", requireAdmin, (req, res) => {
  const allClicks = clicks.length;
  const artworkClicks = clicks.filter((c) => c.type === "artwork").length;
  const navClicks = clicks.filter((c) => c.type === "nav").length;

  const topArtworks = Object.entries(
    clicks
      .filter((c) => c.type === "artwork")
      .reduce((acc, c) => {
        acc[c.target] = (acc[c.target] || 0) + 1;
        return acc;
      }, {})
  )
    .map(([target, count]) => ({ target, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topNav = Object.entries(
    clicks
      .filter((c) => c.type === "nav")
      .reduce((acc, c) => {
        acc[c.target] = (acc[c.target] || 0) + 1;
        return acc;
      }, {})
  )
    .map(([target, count]) => ({ target, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const recent = clicks.slice(-25).reverse();

  res.json({
    ok: true,
    totals: { allClicks, artworkClicks, navClicks },
    topArtworks,
    topNav,
    recent
  });
});

// --- Proteger dashboard ---
app.get("/dashboard.html", (req, res) => {
  if (req.session?.user?.is_admin) {
    return res.sendFile(path.join(__dirname, "public", "dashboard.html"));
  }
  return res.redirect("/login.html");
});

// --- Iniciar ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`Servidor listo en http://localhost:${PORT}`)
);
