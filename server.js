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

// Charger manifest.json une seule fois au démarrage
const manifestPath = path.join(__dirname, "dist", ".vite", "manifest.json")
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))

// Récupérer entrée principale (adapte selon ton projet)
const entryKey = Object.keys(manifest).find(k => k.endsWith("main.js"))
const entry = manifest[entryKey]

// Routes SPA
app.get("/*", (req, res) => {
  if (!entry) {
    return res.status(500).send("Erreur : manifest.json introuvable ou invalide.")
  }
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
