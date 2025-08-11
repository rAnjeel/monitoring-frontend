import axios from 'axios'
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

export function mergeCredentials(existing, imported) {
  console.log('[mergeCredentials] Credentials existants :', existing)
  console.log('[mergeCredentials] Credentials importés :', imported)
  const map = new Map()
  for (const c of existing) {
    const ip = String(c.Ip).trim()
    map.set(ip, { ...c, Ip: ip })
  }
  for (const c of imported) {
    const ip = String(c.Ip).trim()
    map.set(ip, { ...c, Ip: ip })
  }
  const merged = Array.from(map.values())
  console.log('[mergeCredentials] Résultat de la fusion :', merged)
  return merged
}

export async function fetchCredentials() {
  const startTime = Date.now();
  console.log('[FetchCredentials] Début de la récupération des credentials...');

  try {
    console.log('[FetchCredentials] Envoi de la requête GET à /import-csv');
    const response = await api.get('/import-csv');
    
    console.log(`[FetchCredentials] Réponse reçue avec statut ${response.status}`);
    console.debug('[FetchCredentials] Données reçues:', response.data);
    console.log(`[FetchCredentials] Opération réussie en ${Date.now() - startTime}ms`);
    
    return response.data;
  } catch (error) {
    console.error('[FetchCredentials] Erreur lors de la récupération:', {
      error: error.message,
      stack: error.stack,
      config: error.config,
      response: error.response?.data
    });
    
    const errorMessage = 'Impossible de charger les contacts';
    console.error(`[FetchCredentials] ${errorMessage}`);
    throw new Error(errorMessage);
  } finally {
    console.log(`[FetchCredentials] Temps total d'exécution: ${Date.now() - startTime}ms`);
  }
}


export function deleteContact(list, id) {
  const idStr = String(id).trim()
  return list.filter((c) => String(c.id).trim() !== idStr)
}

export function updateContact(list, updatedContact) {
  const idStr = String(updatedContact.id).trim()
  return list.map((c) => (String(c.id).trim() === idStr ? { ...updatedContact, id: idStr } : c))
}

export function order(list, direction = 'asc') {
  return [...list].sort((a, b) => {
    const idA = String(a.id).trim()
    const idB = String(b.id).trim()
    if (!isNaN(idA) && !isNaN(idB)) {
      return direction === 'asc' ? Number(idA) - Number(idB) : Number(idB) - Number(idA)
    }
    return direction === 'asc' ? idA.localeCompare(idB) : idB.localeCompare(idA)
  })
}

export function exportContactsToCSV(list) {
  if (!list.length) return
  const headers = Object.keys(list[0])
  const csvRows = [headers.join(',')]
  for (const contact of list) {
    const row = headers.map((h) => {
      const val = contact[h] ?? ''
      if (
        typeof val === 'string' &&
        (val.includes(',') || val.includes('"') || val.includes('\n'))
      ) {
        return '"' + val.replace(/"/g, '""') + '"'
      }
      return val
    })
    csvRows.push(row.join(','))
  }
  const csvContent = csvRows.join('\r\n')
  const blob = new Blob([csvContent], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'contacts.csv'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function syncCredentials() {
  try {
    console.log('[GetCredentials] Début du test de synchronisation des credentials...');
    const response = await api.get('/credentials/sync')
    return response.data
  } catch (error) {
    console.error('[GetCredentials] Erreur lors de la récupération:', error)
    throw new Error('Impossible de charger les credentials')
  }
}

export async function bulkUpdateCredentials(updatedRows) {
  try {
    const results = [];

    for (const row of updatedRows) {
      const id = row.id;
      if (!id) continue;

      const { data: existing } = await api.get(`/credentials/${id}`);

      // Fusion des données existantes et des nouvelles
      const updated = {
        ...existing,
        ...row,
      };

      // Envoi de la requête PUT avec les données mises à jour
      const { data: response } = await api.put(`/credentials/${id}`, updated);
      results.push(response);
    }

    return results;
  } catch (error) {
    console.error('[bulkUpdateCredentials] Erreur:', error);
    throw new Error('Échec de la mise à jour des credentials');
  }
}



