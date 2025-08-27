import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir le build Vite (assets statiques)
app.use(express.static(path.join(__dirname, "dist")));

// Exemple route qui rend une vue
app.get("/", (req, res) => {
  res.render("index", { apiBaseUrl: process.env.VITE_API_BASE_URL });
});

// Catch-all pour SPA routes (si tu veux que toutes les routes front passent par index.ejs)
app.get("*", (req, res) => {
  res.render("index", { apiBaseUrl: process.env.VITE_API_BASE_URL });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
