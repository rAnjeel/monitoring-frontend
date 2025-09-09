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
const showResultModal = ref(false)
const importResults = ref([])

const api = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000',
})

function handleFileChange(event) {
  fileRef.value = event.target.files[0] || null
  console.log('[CsvImport] Fichier sélectionné :', fileRef.value?.name)
}

async function handleImport() {
  if (!fileRef.value) {
    error.value = 'Veuillez sélectionner un fichier CSV.'
    return
  }

  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      isImporting.value = true
      const text = e.target.result
      const data = parseCSV(text)
      if (!data.length) throw new Error('Fichier vide ou mal formaté')

      // Envoi du JSON à NestJS
      const res = await api.post('/import-csv', data)

      // On récupère les résultats
      importResults.value = res.data
      showResultModal.value = true

      emit('import', { data, name: fileRef.value.name })
      error.value = ''
    } catch (e) {
      error.value = "Erreur lors de l'import : " + e.message
    } finally {
      isImporting.value = false
    }
  }
  reader.readAsText(fileRef.value)
}

function closeResultModal() {
  showResultModal.value = false
  importResults.value = []
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
                role="button"
                tabindex="0"
                aria-label="Glissez un fichier CSV ou cliquez pour sélectionner"
                style="border:2px dashed #ccc; border-radius:6px; padding:30px; text-align:center; cursor:pointer;"
              >
                <div class="dz-inner">
                  <i class="glyphicon glyphicon-upload" style="font-size:2rem;"></i>
                  <div class="dz-title" style="margin-top:10px;">Drag your file here</div>
                  <div class="dz-sub" style="color:#667;">or click to upload</div>
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
                  Import
                </button>
                <button class="btn btn-link btn-sm" type="button" @click="handleClear" :disabled="!fileName">
                  Clear
                </button>
              </div>

              <!-- Error -->
              <div v-if="error" class="alert alert-danger" style="margin-top:15px;">
                {{ error }}
              </div>

              <!-- Info -->
              <div style="margin-top:8px; color:#777; font-size:12px;">
                Accepted format: .csv • Encoding UTF-8 Recommended
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Résultats Import -->
  <div v-if="showResultModal" class="modal fade in" tabindex="-1" style="display:block; background: rgba(0,0,0,0.3);">
    <div class="modal-dialog" style="max-width:600px;">
      <div
        class="modal-content"
        style="
          padding: 20px;
          border:0;
          border-radius:12px;
          background: #fff;
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        "
      >
        <h4 style="font-weight:bold; margin-bottom:15px;">Import result</h4>

        <div style="max-height:300px; overflow-y:auto; text-align:left;">
          <ul class="list-group">
            <li
              v-for="(result, idx) in importResults"
              :key="idx"
              class="list-group-item"
              :class="{'list-group-item-success': result.status === 'success', 'list-group-item-danger': result.status === 'error'}"
            >
              <strong>{{ result.status.toUpperCase() }}</strong> - {{ result.message }}
            </li>
          </ul>
        </div>

        <div style="margin-top:20px; text-align:center;">
          <button class="btn btn-primary" @click="closeResultModal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>