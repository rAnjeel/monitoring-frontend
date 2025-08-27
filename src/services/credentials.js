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

export async function getCredentials() {
  try {
    console.log('[GetCredentials] Début de la récupération des credentials...');
    const response = await api.get('/credentials')
    return response.data
  } catch (error) {
    console.error('[GetCredentials] Erreur lors de la récupération:', error)
    throw new Error('Impossible de charger les credentials')
  }
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

export async function bulkUpdateCredentials(updatedRows) {
  try {
    const results = [];

    for (const row of updatedRows) {
      const id = row.id;
      if (!id) continue;

      // Données existantes depuis la base
      const { data: existing } = await api.get(`/credentials/${id}`);

      const updated = {
        ...existing,
        siteUsername: row.siteUsername?.trim() !== '' ? row.siteUsername : existing.siteUsername,
        sitePassword: row.sitePassword?.trim() !== '' ? row.sitePassword : existing.sitePassword,
        sitePort: Number(row.sitePort) !== '' ? row.sitePort : existing.sitePort,
        isSitePasswordVerified: row.sitePassword?.trim() !== '' ? 1 : existing.isSitePasswordVerified,
        lastDateChange: new Date().toISOString()
      };

      const { data: response } = await api.put(
        `/credentials/solve/${id}`,
        updated
      );

      results.push(response);
    }

    return {
      success: true,
      updatedCount: results.length,
      data: results
    };

  } catch (error) {
    console.error('[bulkUpdateCredentials] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Échec de la mise à jour des credentials'
    };
  }
}

export async function bulkUpdateFormCredentials(updatedRows, formValues) {
  try {
    const results = [];

    if (!formValues) {
      throw new Error('Aucune donnée du formulaire à mettre à jour');
    }

    const { username, password, port } = formValues;

    if (!username && !password && !port) {
      throw new Error('Aucune donnée du formulaire à mettre à jour');
    }

    for (const row of updatedRows) {
      const id = row.id;
      if (!id) continue;

      const { data: existing } = await api.get(`/credentials/${id}`);

      const updated = {
        ...existing,
        ...(username && { siteUsername: username }),
        ...(password && { sitePassword: password }),
        ...(port && { sitePort: Number(port) }),
        lastDateChange: new Date().toISOString()
      };

      const { data: response } = await api.put(`/credentials/solve/${id}`, updated);

      results.push(response);
    }

    return {
      success: true,
      updatedCount: results.length,
      data: results
    };

  } catch (error) {
    console.error('[bulkUpdateFormCredentials] Erreur:', error);
    return {
      success: false,
      error: error.message || 'Échec de la mise à jour des credentials'
    };
  }
}


export async function testCredentialsList(selectedRows) {
  try {
    if (!selectedRows || !selectedRows.length) {
      return { success: false, error: 'Aucune ligne sélectionnée' }
    }

    const credentialsData = []

    // Get tous les credentials
    for (const row of selectedRows) {
      const id = row.id
      if (!id) continue

      const { data: existing } = await api.get(`/credentials/${id}`)
      credentialsData.push(existing)
    }

    //Envoyer la liste complète pour test
    const response = await api.post(`/credentials/sync/database`, credentialsData)

    return response.data
  } catch (error) {
    console.error('[testCredentialsList] Erreur:', error)
    return {
      success: false,
      error: error.message || 'Échec du test de la liste de credentials'
    }
  }
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


export async function getHistoricCredentials() {
  try {
    console.log('[GetHistoricCredentials] Début de la récupération...');
    const response = await api.get('/credentials/list-connection', {
      headers: {
        'Accept': 'application/json',
      },
    });
    console.log('[GetHistoricCredentials] Réponse:', response.data);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('[GetHistoricCredentials] Erreur Axios:', {
        status: error.response?.status,
        data: error.response?.data,
      });
    }
    throw new Error('Échec de la récupération. Vérifiez les logs serveur.');
  }
}


