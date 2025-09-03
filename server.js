import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import express from "express"
import dotenv from "dotenv"
dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()

// Config EJS
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "views"))

// Servir le dossier dist (assets statiques)
app.use(express.static(path.join(__dirname, "dist")))

// Charger manifest.json une seule fois au démarrage et le mettre en cache
let manifestCache = null

try {
  const manifestPath = path.join(__dirname, "dist", ".vite", "manifest.json")
  manifestCache = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  console.log("✅ Manifest chargé avec succès")
} catch (error) {
  console.error("❌ Erreur lecture manifest:", error)
  process.exit(1) // Arrêter le serveur si le manifest est introuvable
}

// Récupérer entrée principale une fois pour toutes
const entryKey = Object.keys(manifestCache).find(k => k.endsWith("index.html"))
const entry = manifestCache[entryKey]

if (!entry) {
  console.error("❌ Entrée principale non trouvée dans manifest")
  process.exit(1)
}

// Routes SPA
app.get("/*", (req, res) => {
  res.render("index", {
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    jsFile: entry.file,
    cssFile: entry.css ? entry.css[0] : null,
  })
})

// Lancer serveur
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})