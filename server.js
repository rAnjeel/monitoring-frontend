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

// Fonction pour lire le manifest
function getManifest() {
  try {
    const manifestPath = path.join(__dirname, "dist", ".vite", "manifest.json")
    return JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  } catch (error) {
    console.error("Erreur lecture manifest:", error)
    return null
  }
}

// Routes SPA
app.get("/*", (req, res) => {
  const manifest = getManifest()
  
  if (!manifest) {
    return res.status(500).send("Erreur : manifest.json introuvable ou invalide.")
  }
  
  const entryKey = Object.keys(manifest).find(k => k.endsWith("main.js") || k.endsWith("index.js"))
  
  if (!entryKey) {
    return res.status(500).send("Erreur : entrée principale non trouvée dans manifest.")
  }
  
  const entry = manifest[entryKey]
  
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