import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use('/dist', express.static(path.join(__dirname, 'monitoring-cli/dist')));
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')));
app.use('/bootstrap', express.static(path.join(__dirname, 'monitoring-cli/public/bootstrap')));


function getFiles(dir, skipUnminified = false) {
  return fs.readdirSync(dir)
    .filter(f => {
      if (skipUnminified) {
        return f.endsWith('.min.css') || f.endsWith('.min.js') || f.match(/^(app|chunk-vendors)\..+\.(css|js)$/);
      }
      return f.endsWith('.css') || f.endsWith('.js');
    });
}

// Servir aussi les fichiers du dossier public (bootstrap, images…)

app.get('/', (req, res) => {
  const cssFiles = getFiles(path.join(__dirname, 'monitoring-cli/dist/css'), true);
  const jsFiles = getFiles(path.join(__dirname, 'monitoring-cli/dist/js'), true);

  res.render('index', { cssFiles, jsFiles });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
