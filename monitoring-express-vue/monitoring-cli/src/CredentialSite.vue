<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { syncCredentials, bulkUpdateCredentials, bulkUpdateFormCredentials, getHistoricCredentials, testCredentialsList, testCredentialsForm } from './services/credentials'
import { formatDateFR } from './utils/dateFormatter'
import { exportAgGridToCsv } from './utils/csv.js'
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
    
import './assets/credential.css'
import './assets/main.css'
import _ from 'lodash'
import MainGrid from './components/grids/MainGrid.vue'
import MismatchGrid from './components/grids/MismatchGrid.vue'

ModuleRegistry.registerModules([ AllCommunityModule ]);

/* eslint-disable no-undef */
defineProps({
  initialCredentials: {
    type: Array,
    default: () => []
  }
})


onMounted(async () => {
  document.addEventListener("contextmenu", disableContextMenu)
  await loadCredentials()
  filteredCredentials.value = credentials.value
})


onBeforeUnmount(() => {
  document.removeEventListener("contextmenu", disableContextMenu)
})

function disableContextMenu(e) {
  e.preventDefault()
}

const noMismatchMessage = ref('');
const credentials = ref([])
const loading = ref(false)
const error = ref(null)
const showModal = ref(false)
const modalCredential = ref({})
const syncResult = ref(null)
const updatedRows = ref([])
const gridRefMismatch = ref(null)
const gridRef = ref(null)
const selectedRows = ref([])
const lastUpdated = ref(null)
const showSuccessModal = ref(false)
const successMessage = ref('')
const showTestModal = ref(false)
const testResults = ref([])
const allSelected = ref(false)
const showPassword = ref(false);
const formValues = ref({
  username: '',
  password: '',
  port: '',
})

const columnDefs = ref([
  { field: 'id', headerName: 'ID', flex: 2, suppressCsvExport: true },

  { field: 'Ip', headerName: 'IP', flex: 5 },

  { 
    field: 'CodeSite', 
    headerName: 'Site', 
    flex: 3, 
    cellRenderer: (p) => `<span class="label label-primary">${p.value ?? ''}</span>` 
  },

  { field: 'siteUsername', headerName: 'Site Username', flex: 4 },

  { 
    field: 'sitePort', 
    headerName: 'Port', 
    flex: 3, 
    cellRenderer: (p) => `<span class="label label-info">${p.value ?? ''}</span>` 
  },

  { 
    field: 'siteSShVersion', 
    headerName: 'SSH', 
    flex: 3, 
    cellRenderer: (p) => `<span class="label label-success">${p.value ?? ''}</span>` 
  },

  {
    field: 'lastDateChange',
    headerName: 'Last Date Change',
    suppressCsvExport: true,
    flex: 6,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return formatDateFR(params.value);
    }
  },

  {
    field: 'lastConnectionError',
    headerName: 'Last Connection Failed',
    flex: 6,
    suppressCsvExport: true,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return formatDateFR(params.value);
    }
  },
])

const columnMismatchDefs = ref([
  { field: 'id', headerName: 'ID', flex: 2 },
  { field: 'Ip', headerName: 'IP', flex: 5 },
  { field: 'sitePort', headerName: 'Port', flex: 5, editable: true },
  { field: 'siteUsername', headerName: 'Username', flex: 5, editable: true },

  { 
    field: 'usernameMatch', 
    headerName: 'Username Match', 
    flex: 4, 
    cellRenderer: (params) => {
      return params.value
        ? '<span class="label label-success">OK</span>'
        : '<span class="label label-danger">Mismatch</span>';
    }
  },

  { 
    field: 'passwordMatch', 
    headerName: 'Password Match', 
    flex: 4, 
    cellRenderer: (params) => {
      return params.value
        ? '<span class="label label-success">OK</span>'
        : '<span class="label label-danger">Mismatch</span>';
    }
  },

  { 
    field: 'portMatch', 
    headerName: 'Port Match', 
    flex: 4, 
    cellRenderer: (params) => {
      return params.value
        ? '<span class="label label-success">OK</span>'
        : '<span class="label label-danger">Mismatch</span>';
    }
  }
])

const defaultColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  autoHeight: false,
  wrapText: false,
  cellStyle: { 
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap'
  },
  onCellContextMenu: (event) => {
      const menu = document.getElementById("customMenu");
      window.cellClicked = event;
      menu.style.display = "block";
      menu.style.position = "absolute";
      menu.style.left = event.event.pageX + "px";
      menu.style.top = event.event.pageY + "px";
      console.log('Context menu 1 opened at:', menu.style);
      
    }
  }

const defaultColDefMismatch = {
  sortable: true,
  filter: true,
  resizable: true,
  autoHeight: false,
  wrapText: false,
  cellStyle: { 
    display: 'flex',
    alignItems: 'center',
    whiteSpace: 'nowrap'
  },
  onCellContextMenu: (event) => {
    const menu = document.getElementById("customMenuMismatch");
    window.cellClicked = event;
    menu.style.left = event.event.clientX + "px";
    menu.style.top = event.event.clientY + "px";
    menu.style.display = "block";
    console.log('Context menu 2 opened at:', menu.style);
  }
}

const searchQuery = ref('')
const filteredCredentials = ref([])
let searchTimeout = null
const showExportModal = ref(false)
const exportFileName = ref('export.csv')
const mismatchCount = computed(() => syncResult.value?.mismatches?.length || 0)
const matchedCount = computed(() => syncResult.value?.matches?.length || 0)
const totalSites = computed(() => matchedCount.value + mismatchCount.value)

// Runtime context menu for mismatch grid on simple click
const showContextMenuRuntime = ref(false)
const contextMenuPos = ref({ x: 0, y: 0 })
const contextMenuItemsRuntime = ref([])

// Mismatch details modal state
const showMismatchModal = ref(false)
const currentMismatch = ref(null)
const isFormComplete = computed(() => {
  return formValues.value.username.trim() !== '' &&
         formValues.value.password.trim() !== '' &&
         formValues.value.port.toString().trim() !== ''
})



function handleViewDetails(id) {
  if (!id) return
  const item = syncResult.value?.mismatches?.find((m) => m.id === id) 
  currentMismatch.value = item || null
  showMismatchModal.value = Boolean(item)
  onCustomMenuCloseClick()
}

document.addEventListener('click', () => { showContextMenuRuntime.value = false })

function applySearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
  if (!searchQuery.value) {
    filteredCredentials.value = credentials.value
    return
  }
  const query = searchQuery.value.toLowerCase()
  filteredCredentials.value = _.filter(credentials.value, (item) => {
    return (
      String(item.id).toLowerCase().includes(query) ||
      String(item.Ip).toLowerCase().includes(query) ||
      String(item.CodeSite).toLowerCase().includes(query) ||
      String(item.siteUsername).toLowerCase().includes(query) ||
      String(item.sitePort).toLowerCase().includes(query)
    )
  })
  }, 150)
}

watch(credentials, () => {
  applySearch()
})

async function loadCredentials() {
  loading.value = true
  error.value = null
  try {
    credentials.value = await getHistoricCredentials()
  } catch (err) {
    error.value = err.message
    console.error('Erreur lors du chargement:', err)
  } finally {
    loading.value = false
    lastUpdated.value = new Date()
  }
}

function isMismatch(credential) {
  return syncResult.value?.mismatches?.some(m => m.id === credential.id)
}

function isMatch(credential) {
  return syncResult.value?.matches?.some(m => m.id === credential.id)
}

function closeFormModal() {
  showModal.value = false
  modalCredential.value = {}
}

const onGridReady = (params) => { gridRef.value = params.api }

const onMismatchGridReady = (params) => { gridRefMismatch.value = params.api }

async function syncSites() {
  loading.value = true;
  try {
    syncResult.value = await syncCredentials();    

    if (
      (!syncResult.value?.matches || syncResult.value.matches.length === 0) &&
      (!syncResult.value?.mismatches || syncResult.value.mismatches.length === 0)
    ) {
      noMismatchMessage.value = 'Aucun mismatch détecté. Tous les credentials sont synchronisés.';
      return;
    }
    if (gridRef.value?.api) {
      showSyncSummary();
    }
    await loadCredentials();
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
    lastUpdated.value = new Date()
  }
}


function showSyncSummary() {
  if (!syncResult.value) return;

  const total = credentials.value.length;
  const matches = syncResult.value.matches.length;
  const mismatches = syncResult.value.mismatches;

  console.log(`
    Synchronisation terminée :
    - Correspondances : ${matches}/${total}
    - Non-correspondances : ${mismatches.length}
  `);

  if (mismatches.length > 0) {
    console.log(`🔍 Détails des non-correspondances :`);
    mismatches.forEach((item, index) => {
      console.log(`Mismatch #${index + 1} (ID: ${item.id})`);
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id') {
          console.log(`  ${key}: ${JSON.stringify(value, null, 2)}`);
        }
      });
    });
  } else {
    noMismatchMessage.value = 'No mismatch found';
  }
}

// removed unused legacy handler; ButtonRenderer now handles test clicks

const rowClassRules = (params) => {
  if (isMismatch(params.data)) return 'row-mismatch'
  if (isMatch(params.data)) return 'row-match'
  return ''
}


function onSelectionChanged(event) {
  const api = event.api
  selectedRows.value = api.getSelectedRows() || []
  console.log("Lignes sélectionnées :", selectedRows.value)
  console.log("=== LIGNES SÉLECTIONNÉES ===", selectedRows.value.length)
}

const showSaveButton = ref(false)


async function saveUpdates() {
  try {
    await bulkUpdateCredentials(updatedRows.value)
    openSuccessModal('Mise à jour réussie')
    updatedRows.value = []
  } catch (err) {
    openSuccessModal('Échec de la mise à jour')
    console.error(err)
  }
}


function getSelectedRows() {
  console.log("=== LIGNES SÉLECTIONNÉES ===")
  selectedRows.value.forEach((row, index) => {
    console.log(`\nLigne ${index + 1}:`)
    console.log(`ID: ${row.id}`)
    console.log(`IP: ${row.Ip}`)
    console.log(`Site: ${row.CodeSite}`)
  })

  console.log(`\nTotal: ${selectedRows.value.length} ligne(s) sélectionnée(s)`)

  showFormModal() 
}

function showFormModal() {
  showModal.value = true
}

async function updateSelectedCredentials(formValues) {
  if (!selectedRows.value.length) {
    console.warn('[updateSelectedCredentials] Aucune ligne sélectionnée')
    return
  }

  console.log('[updateSelectedCredentials] Valeurs du formulaire :', formValues)
  console.log('[updateSelectedCredentials] Lignes sélectionnées :', selectedRows.value)

  try {
    await bulkUpdateFormCredentials(selectedRows.value, formValues)
    console.log(`[updateSelectedCredentials] Mise à jour réussie pour ${selectedRows.value.length} ligne(s)`)
    onCustomMenuCloseClick()
    openSuccessModal('Mise à jour réussie')
  } catch (err) {
    console.error('[updateSelectedCredentials] Erreur lors de la mise à jour :', err)
  } finally {
    await loadCredentials()
    closeFormModal()
    selectedRows.value = []
  }
}


async function runTestSelectedCredentials() {
  onCustomMenuCloseClick()
  if (!selectedRows.value.length) {
    console.warn('[runTestSelectedCredentials] Aucune ligne sélectionnée')
    return
  }

  loading.value = true
  try {
    console.log('[runTestSelectedCredentials] Lignes sélectionnées :', selectedRows.value)

    syncResult.value = await testCredentialsList(selectedRows.value)

    if (!syncResult.value || syncResult.value.length === 0) {
      noMismatchMessage.value = 'Aucun résultat de test disponible.'
      return
    }

    console.log('[runTestSelectedCredentials] Résultats du test :', syncResult.value)

    if (gridRef.value?.api) {
      showSyncSummary() // ou une fonction spécifique type showTestSummary() si tu veux séparer
    }

    await loadCredentials()
  } catch (err) {
    error.value = err.message
    console.error('[runTestSelectedCredentials] Erreur lors du test de la liste de credentials :', err)
  } finally {
    loading.value = false
    lastUpdated.value = new Date()
  }
}

async function runTestFormCredentials() {
  onCustomMenuCloseClick()
  if (!selectedRows.value.length) {
    console.warn('[runTestSelectedCredentials] Aucune ligne sélectionnée')
    return
  }

  loading.value = true
  const selected = selectedRows.value
  try {
    console.log('[runTestSelectedCredentials] Lignes sélectionnées :', selectedRows.value)

    syncResult.value  = await testCredentialsForm(selectedRows.value, formValues.value)

    if (!syncResult.value || syncResult.value.length === 0) {
      noMismatchMessage.value = 'Aucun résultat de test disponible.'
      return
    }

    console.log('[runTestSelectedCredentials] Résultats du test :', syncResult.value)
    showTestSummary() 

  } catch (err) {
    error.value = err.message
    console.error('[runTestSelectedCredentials] Erreur lors du test de la liste de credentials :', err)
  } finally {
    loading.value = false
    lastUpdated.value = new Date()
    selectedRows.value = selected
  }
}



function handleExport() {
  showExportModal.value = true
}

function confirmExport() {
  let name = exportFileName.value.trim()
  if (!name.endsWith('.csv')) name += '.csv'
  const exportColumns = ref([
    { field: 'Ip', headerName: 'Ip'},
    { field: 'CodeSite', headerName: 'CodeSite'},
    { field: 'siteUsername', headerName: 'siteUsername'},
    { field: 'sitePassword', headerName: 'sitePassword'},
    { field: 'sitePort', headerName: 'sitePort'},
    { field: 'siteSShVersion', headerName: 'siteSShVersion'},
  ])

  exportAgGridToCsv(exportColumns.value, filteredCredentials.value, name)
  showExportModal.value = false
}

function cancelExport() {
  showExportModal.value = false
}

function clearSearch() {
  searchQuery.value = ''
  filteredCredentials.value = credentials.value
}

function onCustomMenuUpdateClick() {  
  if (selectedRows.value.length > 0) {
    console.log("=== LIGNES SÉLECTIONNÉES ===")
    console.log(`\nTotal: ${selectedRows.value.length} ligne(s) sélectionnée(s)`)

    showFormModal() 
  } else {
    console.log("Aucune ligne sélectionnée pour la synchronisation");
  }
  document.getElementById('customMenu').style.display = 'none';
}

function onCustomMenuCloseClick() {
  document.getElementById('customMenu').style.display = 'none';
}

// Custom menu for mismatch grid
function onCustomMenuMismatchCloseClick() {
  document.getElementById('customMenuMismatch').style.display = 'none';
}

function onCustomMenuMismatchDetailsClick() {
  const cell = window.cellClicked;
  if (cell && cell.data && cell.data.id) {
    handleViewDetails(cell.data.id);
  }
  document.getElementById('customMenuMismatch').style.display = 'none';
}

function onCustomMenuMismatchUpdateClick() {
  getSelectedRows()
  onCustomMenuMismatchCloseClick()

  const rows = (gridRefMismatch.value?.api ? gridRefMismatch.value.api : null)?.getSelectedRows?.() || []
  
  if (rows.length > 0) {
    selectedRows.value = rows

    console.log("=== LIGNES SÉLECTIONNÉES ===")
    rows.forEach((row, index) => {
      console.log(`\nLigne ${index + 1}:`)
      console.log(`ID: ${row.id}`)
      console.log(`IP: ${row.Ip}`)
      console.log(`Site: ${row.CodeSite}`)
    })

    console.log(`\nTotal: ${rows.length} ligne(s) sélectionnée(s)`)

    showFormModal() 
  } else {
    console.log("Aucune ligne sélectionnée pour la synchronisation");
  }
}

function onRowClicked(event) {
  selectedRows.value = [event.data]
  console.log("Row clicked & selected:", event.data)
}


function selectAllRows() {
  selectedRows.value = filteredCredentials.value
  console.log("All rows selected:", selectedRows.value)
}

function unselectAllRows() {
  selectedRows.value = []
  console.log("All rows unselected:", selectedRows.value)
}

function toggleSelectAll() {
  if (allSelected.value) {
    unselectAllRows()
    allSelected.value = false
  } else {
    selectAllRows()
    allSelected.value = true
  }
}

function openSuccessModal(message) {
  successMessage.value = message
  showSuccessModal.value = true
}
function closeSuccessModal() {
  showSuccessModal.value = false
  successMessage.value = ''
}

function showTestSummary() {
  const results = []

  if (syncResult.value.mismatches.length === 0) {
    results.push({
      success: true,
      message: "Tous les credentials ont réussi ✅"
    })
  } else {
    syncResult.value.mismatches.forEach((m) => {
      results.push({
        success: false,
        message: `Échec sur ${m.Ip}:${m.sitePort} - ${m.errorDescription || 'Erreur inconnue'}`
      })
    })
  }

  testResults.value = results
  showTestModal.value = true
}



function closeTestModal() {
  showTestModal.value = false
}

</script>

<template>
  <!-- Header -->
  <div class="dashboard-header">
    <div class="d-flex align-items-center justify-content-between pt-5">
      <div>
        <div class="breadcrumbs">
          <span class="crumb">Monitoring</span>
          <span class="sep">/</span>
          <span class="crumb">Overview</span>
        </div>
        <h3 class="mt-2 mb-0 text-gradient">Sites credentials</h3>
        <small class="text-muted">Last update: {{ lastUpdated ? new Date(lastUpdated).toLocaleString() : '—' }}</small>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="syncSites" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-arrow-repeat me-2"></i>
          Synchronize all sites
        </button>
      </div>
    </div>
  </div>

  <div v-if="loading" class="modal fade in" tabindex="-1" style="display:block; background: rgba(0,0,0,0.3); z-index:2000;">
    <div class="modal-dialog" style="margin-top:20%;">
      <div class="modal-content" style="border:0; background:transparent; box-shadow:none;">
        <div class="alert alert-info text-center" style="font-size:1.2rem; margin:0;">
          <!-- Spinner CSS -->
          <div class="spinner" style="margin:0 auto 15px;"></div>
          <div>Test SSH des sites en cours ...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Message d'erreur -->
  <div v-if="error" class="alert alert-danger">
    {{ error }}
    <button @click="loadCredentials" class="btn btn-xs btn-danger" style="margin-left:8px;">
      Retry
    </button>
  </div>

  <div class="p-4" style="padding:20px; border-radius:8px;">
    <div v-if="noMismatchMessage" class="alert alert-success" style="margin-top:20px;">
      {{ noMismatchMessage }}
    </div>

    <div v-if="syncResult?.mismatches?.length" style="margin-top:20px;">
      <div class="panel" style="padding:20px; border-radius:6px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">

        <!-- Header Stats -->
        <div class="panel-heading" style="display:flex; justify-content:space-between; align-items:center; text-transform:uppercase;">
          <h4 class="panel-title" style="margin:0;">Statistics</h4>
          <small class="text-muted">Synced: {{ matchedCount }} / {{ totalSites }}</small>
        </div>

        <div class="panel-body">
          <!-- KPIs -->
          <div class="kpi-grid" style="display:flex; gap:15px; margin-bottom:20px;">
            <div class="kpi-card safe" style="flex:1; padding:10px; border-radius:8px; background:#f8f9fa; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.1); transform:translateY(6px);">
              <div>
                <div class="label">Total Sites Synced</div>
                <div class="value">{{ totalSites }}</div>
              </div>
              <i class="bi bi-hdd-network text-primary" style="font-size:1.5rem;"></i>
            </div>

            <div class="kpi-card teal" style="flex:1; padding:10px; border-radius:8px; background:#e6f7f9; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.1); transform:translateY(6px);">
              <div>
                <div class="label">Matches</div>
                <div class="value">{{ matchedCount }}</div>
              </div>
              <i class="bi bi-shield-check text-primary" style="font-size:1.5rem;"></i>
            </div>

            <div class="kpi-card warn" style="flex:1; padding:10px; border-radius:8px; background:#fff3cd; display:flex; justify-content:space-between; align-items:center; box-shadow:0 1px 4px rgba(0,0,0,0.1); transform:translateY(6px);">
              <div>
                <div class="label">Mismatches</div>
                <div class="value">{{ mismatchCount }}</div>
              </div>
              <i class="bi bi-shield-exclamation text-warning" style="font-size:1.5rem;"></i>
            </div>
          </div>

        </div>

        <!-- Sites Issues -->
        <div class="panel-heading" style="display:flex; justify-content:space-between; align-items:center; text-transform:uppercase;">
          <h4 class="panel-title" style="margin:0;">Sites Issues ({{ syncResult.mismatches.length }})</h4>
        </div>

        <div class="panel-body">
          <div class="text-right" style="margin:15px 0;">
            <button class="btn btn-primary btn-sm" @click="getSelectedRows">
              <i class="bi bi-pencil-square"></i> Update Credentials
            </button>
          </div>

          <div class="text-right" style="margin:15px 0;" v-if="showSaveButton">
            <button class="btn btn-success btn-sm" @click="saveUpdates">
              <i class="bi bi-save"></i> Save {{ selectedRows.length }} modification(s)
            </button>
          </div>

          <!-- Grid -->
          <div style="max-height:380px; overflow:auto; margin-top:15px;">
            <MismatchGrid
              :rowData="syncResult.mismatches"
              :columnDefs="columnMismatchDefs"
              :defaultColDef="defaultColDefMismatch"
              :getRowClass="rowClassRules"
              @ready="onMismatchGridReady"
              @selectionChanged="onSelectionChanged"
              @rowClicked="onRowClicked"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Menu contextuel custom -->
  <ul id="customMenu" class="mb-2 small"
      style="position:fixed; display:none; background:white; border:1px solid #ccc; box-shadow:0 2px 6px rgba(0,0,0,0.15); list-style:none; padding:5px; margin:0; z-index:1000; min-width:160px;">
    
    <li class="mb-1">
      <button class="btn btn-xs btn-link text-muted pull-right" type="button" id="btn-close-menu-mismatch" @click="onCustomMenuCloseClick">
        <span class="glyphicon glyphicon-remove"></span>
      </button>
    </li>

    <li id="menu-delete" style="padding:2px;">
      <button class="btn btn-xs btn-default btn-block text-left" 
              type="button" id="btn-delete-mismatch" @click="onCustomMenuUpdateClick" :disabled="!selectedRows.length">
        <span class="glyphicon glyphicon-pencil" style="margin-right:5px;"></span> Update site
      </button>
    </li>

    <li id="menu-sync" style="padding:2px;">
      <button class="btn btn-xs btn-default btn-block text-left" 
              type="button" id="btn-sync-mismatch" @click="runTestSelectedCredentials" :disabled="!selectedRows.length || loading">
        <span class="glyphicon glyphicon-flash" style="margin-right:5px;"></span> Test connexion
      </button>
    </li>
  </ul>

  <!-- Custom menu mismatch -->
  <ul id="customMenuMismatch" class="mb-2 small"
      style="position:fixed; display:none; background:white; border:1px solid #ccc; box-shadow:0 2px 6px rgba(0,0,0,0.15); list-style:none; padding:5px; margin:0; z-index:1000; min-width:160px;">
    
    <li class="mb-1">
      <button class="btn btn-xs btn-link text-muted pull-right" type="button" id="btn-close-menu-mismatch" @click="onCustomMenuMismatchCloseClick">
        <span class="glyphicon glyphicon-remove"></span>
      </button>
    </li>

    <li id="menu-details-mismatch" style="padding:2px;">
      <button class="btn btn-xs btn-default btn-block text-left"
              type="button" id="btn-details-mismatch" @click="onCustomMenuMismatchDetailsClick">
        <span class="glyphicon glyphicon-info-sign" style="margin-right:5px;"></span> Show details
      </button>
    </li>

    <li id="menu-delete-mismatch" style="padding:2px;">
      <button class="btn btn-xs btn-default btn-block text-left"
              type="button" id="btn-delete-mismatch" @click="onCustomMenuMismatchUpdateClick" :disabled="!selectedRows.length">
        <span class="glyphicon glyphicon-pencil" style="margin-right:5px;"></span> Update site
      </button>
    </li>

    <li id="menu-sync-mismatch" style="padding:2px;">
      <button class="btn btn-xs btn-default btn-block text-left"
              type="button" id="btn-sync-mismatch" @click="runTestSelectedCredentials" :disabled="!selectedRows.length || loading">
        <span class="glyphicon glyphicon-flash" style="margin-right:5px;"></span> Test connexion
      </button>
    </li>
  </ul>



  <div class="p-4 rounded">
    <div class="panel panel-default p-4 shadow-sm">
      <div class="panel-heading text-uppercase" style="display: flex; align-items: center; justify-content: space-between;">
        <h5 class="mb-0">
          List Sites 
          <span class="badge">{{ filteredCredentials.length }}</span>
        </h5>
        <div class="btn-group" style="display: flex;">
          <!-- Export -->
          <button class="btn btn-default" @click="handleExport" style="margin-right:6px; border-radius: 50px;">
            <span class="glyphicon glyphicon-download-alt"></span> Export
          </button>

          <button class="btn btn-default" @click="$router.push('/import-csv')" style="margin-right:6px; border-radius: 50px;">
            <span class="glyphicon glyphicon-upload"></span> Import CSV
          </button>


          <!-- Select/Unselect All -->
          <button class="btn btn-default" @click="toggleSelectAll" style="margin-right:6px; border-radius: 50px;">
            <span class="glyphicon glyphicon-check"></span>
            {{ allSelected ? 'Unselect All' : 'Select All' }}
          </button>

          <!-- Reload -->
          <button class="btn btn-link" @click="loadCredentials" :disabled="loading" style="border-radius: 50px;">
            <span v-if="loading" class="glyphicon glyphicon-refresh spinning"></span>
            <span v-else class="glyphicon glyphicon-repeat"></span>
            Reload
          </button>
        </div>
      </div>

      <div class="row" style="margin: 15px 0;">
        <!-- Barre de recherche -->
        <div class="col-sm-8">
          <div class="input-group">
            <span class="input-group-addon">
              <i class="glyphicon glyphicon-search"></i>
            </span>
            <input
              v-model="searchQuery"
              type="text"
              class="form-control"
              placeholder="Search by ID, IP, Site, Username, Port..."
              @input="applySearch"
            />
            <span class="input-group-btn" v-if="searchQuery">
              <button class="btn btn-danger" @click="clearSearch">
                <i class="glyphicon glyphicon-remove"></i> Clear
              </button>
            </span>
          </div>
        </div>

        <!-- Sélection d'éléments -->
        <div class="col-sm-4 text-right" v-if="selectedRows.length">
          <span class="label label-info" style="font-size: 12px; padding: 6px 10px;">
            Selected rows: {{ selectedRows.length }}
          </span>
        </div>
      </div>

      <div v-if="!filteredCredentials.length && !loading" class="p-4 text-center text-muted">
        No results. Try adjusting your search.
      </div>
          
      <div v-else class="col-xs-12">
        <div class="panel-body p-4 menu-grid-container">
          <MainGrid
            ref="gridRef"
            :rowData="filteredCredentials"
            :columnDefs="columnDefs"
            :defaultColDef="defaultColDef"
            :getRowClass="rowClassRules"
            @ready="onGridReady"
            @selection-changed="onSelectionChanged"
            @rowClicked="onRowClicked"
          />
        </div>
      </div>
    </div>
  </div>

  <!-- Runtime context menu for mismatch grid click -->
  <div
    v-if="showContextMenuRuntime"
    class="context-menu"
    :style="{ left: contextMenuPos.x + 'px', top: contextMenuPos.y + 'px' }"
  >
    <div
      v-for="item in contextMenuItemsRuntime"
      :key="item.key"
      class="item"
      @click="item.action()"
    >
      <i class="bi bi-pencil-square"></i>
      <span>{{ item.label }}</span>
    </div>
  </div>

  <!-- Modal Mismatch (Bootstrap 3.4.1) -->
  <div
    v-if="showMismatchModal"
    class="modal fade in"
    tabindex="-1"
    style="display:block; background: rgba(0, 0, 0, 0.3);"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        
        <!-- Header -->
        <div class="modal-header" style="background-color:#f0ad4e; color:#fff;">
          <button type="button" class="close" @click="showMismatchModal = false">&times;</button>
          <h4 class="modal-title">
            Mismatch details - Site #{{ currentMismatch?.id }}
          </h4>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="alert alert-warning">
            <h5>Problemes detected :</h5>
            <ul>
              <li v-if="!currentMismatch?.usernameMatch">❌ Username mismatch</li>
              <li v-if="!currentMismatch?.passwordMatch">❌ Password mismatch</li>
              <li v-if="!currentMismatch?.portMatch">❌ Port mismatch</li>
            </ul>
          </div>
          <div class="alert alert-info">
            <h5>Recommended actions :</h5>
            <p>Please check and update the site information</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showMismatchModal = false">Close</button>
        </div>

      </div>
    </div>
  </div>


  <!-- Modal d'édition (Bootstrap 3.4.1) -->
  <div
    v-if="showModal"
    class="modal fade in"
    tabindex="-1"
    style="display: block; background: rgba(0,0,0,0.3);"
  >
    <div class="modal-dialog" style="max-width: 400px;">
      <div class="modal-content" style="box-shadow: 0 6px 18px rgba(0,0,0,0.15);">
        
        <!-- Header -->
        <div class="modal-header text-center">
          <button type="button" class="close" @click="closeFormModal">&times;</button>
          <h4 class="modal-title text-uppercase">
            <i class="bi bi-pencil-square text-success"></i> Update Sites
          </h4>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <div class="form-group">
            <label>IP (Selected sites)</label>
            <textarea class="form-control" rows="2" readonly :value="selectedRows.map(row => row.Ip).join('\n')"></textarea>
          </div>
          <div class="form-group">
            <label>siteUsername</label>
            <input
              v-model="formValues.username"
              class="form-control"
              type="text"
            />
          </div>
          <div class="form-group" style="position: relative;">
            <label>sitePassword</label>
            <input
              v-model="formValues.password"
              :type="showPassword ? 'text' : 'password'"
              class="form-control"
              style="padding-right: 35px;"
            />
            <span
              class="glyphicon"
              :class="showPassword ? 'glyphicon-eye-close' : 'glyphicon-eye-open'"
              style="position: absolute; right: 10px; top: 27px; cursor: pointer; color: #777;"
              @click="showPassword = !showPassword"
            ></span>
          </div>
          <div class="form-group">
            <label>sitePort</label>
            <input
              v-model="formValues.port"
              class="form-control"
              type="number"
              min="0"
            />
          </div>
        </div>

        <!-- Footer -->
        <div class="modal-footer text-center">
          <button
            class="btn btn-success"
            @click="runTestFormCredentials()"
            :disabled="!isFormComplete"
          >
            Test
          </button>
          <button
            class="btn btn-success"
            @click="updateSelectedCredentials(formValues)"
          >
            Update
          </button>
          <button
            class="btn btn-default"
            @click="closeFormModal"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  </div>

  <!-- Modal Export CSV -->
  <div v-if="showExportModal" class="modal fade in" tabindex="-1" style="display:block; background: rgba(0,0,0,0.3);">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <button type="button" class="close" @click="cancelExport">&times;</button>
          <h4 class="modal-title">Exporter en CSV</h4>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="csvFileName">Nom du fichier :</label>
            <input id="csvFileName" v-model="exportFileName" class="form-control" placeholder="export.csv" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-default" @click="cancelExport">Annuler</button>
          <button class="btn btn-success" @click="confirmExport">Exporter</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Success -->
  <div v-if="showSuccessModal" class="modal fade in" tabindex="-1" style="display:block; background: rgba(0,0,0,0.3);">
    <div class="modal-dialog" style="max-width:420px;">
      <div
        class="modal-content text-center"
        style="
          padding: 25px;
          border:0;
          border-radius:12px;
          background: linear-gradient(135deg,#ffffffcc,#f8f9facc);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        "
      >
        <i class="bi bi-check-circle-fill text-success" style="font-size:2.5rem;"></i>
        <h4 style="margin-top:15px; font-weight:bold;">Result message</h4>
        <p class="text-muted" style="margin-bottom:20px;">{{ successMessage }}</p>
        <button class="btn btn-success" style="padding:6px 20px; border-radius:25px;" @click="closeSuccessModal">
          OK
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Test -->
  <div v-if="showTestModal" class="modal fade in" tabindex="-1" style="display:block; background: rgba(0,0,0,0.3);">
    <div class="modal-dialog" style="max-width:600px;">
      <div
        class="modal-content"
        style="
          padding:25px;
          border:0;
          border-radius:12px;
          background: linear-gradient(135deg,#ffffffcc,#f8f9facc);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        "
      >
        <div class="text-center" style="margin-bottom:20px;">
          <i class="bi bi-info-circle-fill text-primary" style="font-size:2.2rem;"></i>
          <h4 style="margin-top:10px; font-weight:bold;">Résultats du test</h4>
          <p class="text-muted">Voici les résultats pour les credentials testés :</p>
        </div>

        <div v-if="testResults.length">
          <ul class="list-group" style="margin-bottom:20px;">
            <li
              v-for="(result, index) in testResults"
              :key="index"
              class="list-group-item"
              style="display:flex; justify-content:space-between; align-items:center;"
            >
              <div>
                <div style="font-weight:600;">Credential {{ index + 1 }}</div>
                <div class="text-muted small">{{ result.message || 'Aucun message.' }}</div>
              </div>
              <span
                class="badge"
                :style="{
                  backgroundColor: result.success ? '#28a745' : '#dc3545',
                  color: '#fff'
                }"
              >
                {{ result.success ? 'Succès' : 'Échec' }}
              </span>
            </li>
          </ul>
        </div>
        <div v-else class="text-center text-muted">
          Aucun résultat à afficher.
        </div>

        <div class="text-center">
          <button
            class="btn btn-primary"
            style="padding:6px 20px; border-radius:25px;"
            @click="closeTestModal"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  </div>


</template>