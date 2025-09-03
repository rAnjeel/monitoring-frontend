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

// ----------------------
// Servir les fichiers statiques avec logs
// ----------------------
const staticPath = path.join(__dirname, "dist")
console.log(`📁 Serve static files from: ${staticPath}`)

app.use(express.static(staticPath, {
  maxAge: '1h',
  immutable: false,
}))

// Logger chaque requête statique
app.use((req, res, next) => {
  console.log(`🌐 Request: ${req.method} ${req.url}`)
  next()
})

// ----------------------
// Charger manifest.json
// ----------------------
let manifestCache = null
try {
  const manifestPath = path.join(staticPath, ".vite", "manifest.json")
  console.log(`📄 Loading manifest from: ${manifestPath}`)
  manifestCache = JSON.parse(fs.readFileSync(manifestPath, "utf-8"))
  console.log("✅ Manifest loaded successfully")
} catch (error) {
  console.error("❌ Error reading manifest:", error)
  process.exit(1)
}

// Récupérer entrée principale
const entryKey = Object.keys(manifestCache).find(k => k.endsWith("index.html"))
const entry = manifestCache[entryKey]

if (!entry) {
  console.error("❌ Main entry not found in manifest")
  process.exit(1)
}

console.log(`📝 Main entry: ${entryKey}`)
console.log(`   JS: ${entry.file}`)
if (entry.css) console.log(`   CSS: ${entry.css[0]}`)

// ----------------------
// Routes SPA
// ----------------------
app.get("/*", (req, res) => {
  console.log(`📌 SPA route requested: ${req.url}`)
  console.log(`   Serving JS: ${entry.file}`)
  if (entry.css) console.log(`   Serving CSS: ${entry.css[0]}`)
  
  res.render("index", {
    apiBaseUrl: process.env.VITE_API_BASE_URL,
    jsFile: entry.file,
    cssFile: entry.css ? entry.css[0] : null,
  })
})

// ----------------------
// Lancer serveur
// ----------------------
const PORT = process.env.PORT || 8080
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
})
