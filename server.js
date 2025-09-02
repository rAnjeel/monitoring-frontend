import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Config EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Servir les assets du build Vite
// app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, "dist")));

// Routes spécifiques Vue
const vueRoutes = ["/", "/failed-logins", "/import-csv"];
vueRoutes.forEach((route) => {
  app.get(route, (req, res) => {
    res.render("index", { apiBaseUrl: process.env.VITE_API_BASE_URL });
  });
});

// Catch-all pour toutes les autres routes
app.get("/*", (req, res) => {
  res.render("index", { apiBaseUrl: process.env.VITE_API_BASE_URL });
});

// Port conventionnel pour prod
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
