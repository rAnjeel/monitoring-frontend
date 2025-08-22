export function parseCSV(text) {
  const rows = text.split(/\r?\n/).filter(Boolean)
  console.log('[parseCSV] Lignes brutes :', rows)
  if (rows.length < 2) return []
  const headers = rows[0].split(',').map((h) => h.trim())
  console.log('[parseCSV] En-têtes détectés :', headers)
  const result = rows.slice(1).map((row) => {
    const values = row.split(',')
    const obj = {}
    headers.forEach((h, i) => {
      obj[h] = values[i] || ''
    })
    return obj
  })
  console.log('[parseCSV] Résultat final du parsing :', result)
  return result
}

// utils/exportCsv.js
export function exportAgGridToCsv(columnDefs, rowData, fileName = 'export-credentials.csv') {
  const headers = columnDefs
    .filter(col => col.field && !col.hide && !col.excludeFromExport)
    .map(col => col.headerName || col.field)
    .join(',');

  const rows = rowData
    .map(row => {
      const baseValues = columnDefs
        .filter(col => col.field && !col.hide && !col.excludeFromExport)
        .map(col => {
          let value = row[col.field];
          if (value === null || value === undefined) return '';
          
          if (typeof value === 'object') {
            if (value instanceof Date) return value.toISOString();
            return JSON.stringify(value);
          }
          
          if (typeof value === 'string') {
            return `"${value.replace(/"/g, '""')}"`;
          }
          
          return value;
        });

      return baseValues.join(',');
    })
    .join('\n');

  // Combiner en contenu CSV
  const csvContent = `${headers}\n${rows}`;

  // Créer et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
