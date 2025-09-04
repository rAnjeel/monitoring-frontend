/* eslint-disable */
<script setup>
import { ref, computed } from 'vue'
import { parseCSV } from './utils/csv.js'
import axios from 'axios'
import './assets/main.css'
import './assets/csvImport.css'

/* eslint-disable no-undef */
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
  <div class="container" style="margin-top:20px;">
    <div class="row">
      <div class="col-lg-6 col-lg-offset-3">
        <div class="p-3" style="border-radius:8px;">
          <div class="panel panel-default">

            <!-- Header -->
            <div class="panel-heading" style="display:flex; justify-content:space-between; align-items:center; text-transform:uppercase;">
              <h4 class="panel-title" style="margin:0; font-family: 'Space Grotesk', sans-serif;">
                Import CSV
              </h4>
            </div>

            <!-- Body -->
            <div class="panel-body">

              <!-- Dropzone -->
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
                style="border:2px dashed #ccc; border-radius:6px; padding:30px; text-align:center; cursor:pointer;"
              >
                <div class="dz-inner">
                  <i class="glyphicon glyphicon-upload" style="font-size:2rem;"></i>
                  <div class="dz-title" style="margin-top:10px;">Glissez-déposez votre fichier CSV ici</div>
                  <div class="dz-sub" style="color:#667;">ou cliquez pour parcourir</div>
                  <input ref="fileInput" type="file" accept=".csv" @change="handleFileChange" hidden />
                </div>
              </div>

              <!-- File info -->
              <div v-if="fileName" style="margin-top:15px;">
                <span class="label label-default">
                  <i class="glyphicon glyphicon-file"></i> {{ fileName }}
                </span>
                <small class="text-muted" style="margin-left:8px;">{{ fileSize }}</small>
              </div>

              <!-- Buttons -->
              <div style="margin-top:15px;">
                <button class="btn btn-default" @click="$router.push('/')" style="margin-right:6px; border-radius: 50px;">
                  <span class="glyphicon glyphicon-home"></span>
                </button>
                <button class="btn btn-primary btn-sm" type="button" :disabled="!fileName || isImporting" @click="handleImport">
                  <span v-if="isImporting" class="glyphicon glyphicon-refresh spinning" style="margin-right:5px;"></span>
                  Importer
                </button>
                <button class="btn btn-link btn-sm" type="button" @click="handleClear" :disabled="!fileName">
                  Effacer
                </button>
              </div>

              <!-- Error -->
              <div v-if="error" class="alert alert-danger" style="margin-top:15px;">
                {{ error }}
              </div>

              <!-- Info -->
              <div style="margin-top:8px; color:#777; font-size:12px;">
                Format accepté: .csv • Encodage UTF-8 recommandé
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>