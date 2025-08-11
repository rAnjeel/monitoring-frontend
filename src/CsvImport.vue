<script setup>
import { ref, computed } from 'vue'
import { parseCSV } from './utils/csv.js'
import axios from 'axios'
import './assets/main.css'
import './assets/csvImport.css'

const emit = defineEmits(['import', 'export'])
const error = ref('')
const fileRef = ref(null)
const fileInput = ref(null)
const isImporting = ref(false)
const isDragOver = ref(false)

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
})

function handleFileChange(event) {
  fileRef.value = event.target.files[0] || null
  console.log('[CsvImport] Fichier sélectionné :', fileRef.value?.name)
}

async function handleImport() {
  if (!fileRef.value) {
    error.value = 'Veuillez sélectionner un fichier CSV.'
    console.log('[CsvImport] Aucun fichier sélectionné')
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      isImporting.value = true
      const text = e.target.result
      console.log('[CsvImport] Contenu brut du fichier :', text)
      const data = parseCSV(text)
      console.log('[CsvImport] Résultat du parseur CSV :', data)
      if (!data.length) throw new Error('Fichier vide ou mal formaté')

      // Debug: Afficher le JSON qui sera envoyé
      console.log('[CsvImport] JSON à envoyer au backend:', JSON.stringify(data, null, 2))

      // Envoi du JSON à NestJS
      await api.post('/import-csv', data)

      emit('import', { data, name: fileRef.value.name })
      console.log('[CsvImport] Événement import émis avec', data.length, 'lignes')
      error.value = ''
    } catch (e) {
      error.value = "Erreur lors de l'import : " + e.message
      console.error('[CsvImport] Erreur lors de l\'import :', e)
    } finally {
      isImporting.value = false
    }
  }
  reader.readAsText(fileRef.value)
  console.log('[CsvImport] Lecture du fichier lancée')
}


function handleDrop(e) {
  e.preventDefault()
  isDragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.includes('csv') || file?.name?.endsWith('.csv')) {
    fileRef.value = file
  } else {
    error.value = 'Format non supporté. Glissez un fichier .csv.'
  }
}

function handleClear() {
  fileRef.value = null
  error.value = ''
  if (fileInput.value) {
    // reset native input
    fileInput.value.value = ''
  }
}

function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return ''
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
}

const fileName = computed(() => fileRef.value?.name || '')
const fileSize = computed(() => fileRef.value ? formatBytes(fileRef.value.size) : '')
</script>

<template>
  <div class="container mt-4">
    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="p-3 rounded">
          <div class="card mt-3">
            <div class="card-header d-flex align-items-center justify-content-between text-uppercase">
              <h5 class="mb-0" style="font-family: 'Space Grotesk', sans-serif;">Import CSV</h5>
            </div>
            <div class="card-body">
              <div
                class="dropzone"
                :class="{ dragover: isDragOver }"
                @dragover.prevent="isDragOver = true"
                @dragleave.prevent="isDragOver = false"
                @drop="handleDrop"
                @click="$refs.fileInput.click()"
                role="button"
                tabindex="0"
                aria-label="Glissez un fichier CSV ou cliquez pour sélectionner"
              >
                <div class="dz-inner">
                  <i class="bi bi-upload" aria-hidden="true"></i>
                  <div class="dz-title">Glissez-déposez votre fichier CSV ici</div>
                  <div class="dz-sub">ou cliquez pour parcourir</div>
                  <input ref="fileInput" type="file" accept=".csv" @change="handleFileChange" hidden />
                </div>
              </div>

              <div v-if="fileName" class="mt-3">
                <span class="file-chip"><i class="bi bi-filetype-csv me-2"></i>{{ fileName }}</span>
                <small class="text-muted ms-2">{{ fileSize }}</small>
              </div>

              <div class="d-flex gap-2 mt-3">
                <button class="btn btn-m btn-primary" type="button" :disabled="!fileName || isImporting" @click="handleImport">
                  <span v-if="isImporting" class="spinner-border spinner-border-sm me-2"></span>
                  Importer
                </button>
                <button class="btn btn-ghost" type="button" @click="handleClear" :disabled="!fileName">Effacer</button>
              </div>

              <div v-if="error" class="alert alert-danger mt-3">{{ error }}</div>
              <div class="mt-2 text-muted small">Format accepté: .csv • Encodage UTF-8 recommandé</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
