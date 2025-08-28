<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { syncCredentials, bulkUpdateCredentials, bulkUpdateFormCredentials, getHistoricCredentials, testCredentialsList, testCredentialsForm } from './services/credentials'
import { formatDateFR } from './utils/dateFormatter'
import { exportAgGridToCsv } from './utils/csv.js'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'
import './assets/credential.css'
import './assets/main.css'
import _ from 'lodash'
import MainGrid from './components/grids/MainGrid.vue'
import MismatchGrid from './components/grids/MismatchGrid.vue'
import StatsRings from './components/stats/StatsRings.vue'

defineProps({
  initialCredentials: {
    type: Array,
    default: () => []
  }
})

onMounted(() => {
  document.addEventListener("contextmenu", disableContextMenu)
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
const allSelected = ref(false)
const formValues = ref({
  username: '',
  password: '',
  port: '',
})

const columnDefs = ref([
  { field: 'id', headerName: 'ID', flex: 2, excludeFromExport: true },
  { field: 'Ip', headerName: 'IP', flex: 5},
  { field: 'CodeSite', headerName: 'Site', flex: 3, cellRenderer: (p) => `<span class="code-chip">${p.value ?? ''}</span>` },
  { field: 'siteUsername', headerName: 'Site Username', flex: 4 },
  { field: 'sitePort', headerName: 'Port', flex: 3, cellRenderer: (p) => `<span class="code-chip">${p.value ?? ''}</span>` },
  { field: 'siteSShVersion', headerName: 'SSH', flex: 3, cellRenderer: (p) => `<span class="code-chip">${p.value ?? ''}</span>` },
  {
    field: 'lastDateChange',
    headerName: 'lastDateChange',
    excludeFromExport: true,
    flex: 6,
    valueFormatter: (params) => {
      if (!params.value) return '';
      return formatDateFR(params.value); 
    }
  },
  {
    field: 'lastConnectionError', headerName: 'lastConnectionFailed', flex: 6, excludeFromExport: true,
      valueFormatter: (params) => {
      if (!params.value) return '';
      return formatDateFR(params.value); 
    }
  },
])
const columnMismatchDefs = ref([
  { field: 'id', headerName: 'ID', flex: 2 },
  { field: 'Ip', headerName: 'IP', flex: 5},
  { field: 'sitePort', headerName: 'Port', flex: 5, editable: true },
  { field: 'siteUsername', headerName: 'Username', flex: 5, editable: true },
  { field: 'usernameMatch', headerName: 'Username Match', flex: 4 , cellRenderer: (params) => {
      return params.value
        ? '<span class="pill pill-success" style="color:#0b4650">OK</span>'
        : '<span class="pill pill-danger" style="color:#7a1e28">Mismatch</span>'
    }},
  { field: 'passwordMatch', headerName: 'Password Match', flex: 4 , cellRenderer: (params) => {
      return params.value
        ? '<span class="pill pill-success" style="color:#0b4650">OK</span>'
        : '<span class="pill pill-danger" style="color:#7a1e28">Mismatch</span>'
    }},
  { field: 'portMatch', headerName: 'Port Match', flex: 4 , cellRenderer: (params) => {
      return params.value
        ? '<span class="pill pill-success" style="color:#0b4650">OK</span>'
        : '<span class="pill pill-danger" style="color:#7a1e28">Mismatch</span>'
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
      document.body.style.overflow = "hidden";
      
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
    document.body.style.overflow = "hidden";
  }
}

// Chargement des données
onMounted(async () => {
  await loadCredentials()
  filteredCredentials.value = credentials.value
})

const searchQuery = ref('')
const filteredCredentials = ref([])
let searchTimeout = null
const showExportModal = ref(false)
const exportFileName = ref('export.csv')
const mismatchCount = computed(() => syncResult.value?.mismatches?.length || 0)
const matchedCount = computed(() => syncResult.value?.matches?.length || 0)
const totalSites = computed(() => matchedCount.value + mismatchCount.value)

// Stats percentages for staggered tiles
const usernamePct = computed(() => {
  const s = syncResult.value?.stats
  if (!s || !s.total) return 0
  return Math.round((s.usernameMatches / s.total) * 100)
})
const passwordPct = computed(() => {
  const s = syncResult.value?.stats
  if (!s || !s.total) return 0
  return Math.round((s.passwordMatches / s.total) * 100)
})
const portPct = computed(() => {
  const s = syncResult.value?.stats
  if (!s || !s.total) return 0
  return Math.round((s.portMatches / s.total) * 100)
})

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
  }
}


async function runTestSelectedCredentials() {
  closeFormModal()
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
  closeFormModal()
  onCustomMenuCloseClick()
  if (!selectedRows.value.length) {
    console.warn('[runTestSelectedCredentials] Aucune ligne sélectionnée')
    return
  }

  loading.value = true
  try {
    console.log('[runTestSelectedCredentials] Lignes sélectionnées :', selectedRows.value)

    syncResult.value = await testCredentialsForm(selectedRows.value, formValues.value)

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



function handleExport() {
  showExportModal.value = true
}

function confirmExport() {
  let name = exportFileName.value.trim()
  if (!name.endsWith('.csv')) name += '.csv'
  // Ajoute une nouvelle déclaration ref pour conserver les colonnes utilisées à l'export
  // Ip,CodeSite,siteUsername,sitePassword,isSitePasswordVerified,sitePort,siteSShVersion,toVerify
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
  document.body.style.overflow = "auto";
}

// Custom menu for mismatch grid
function onCustomMenuMismatchCloseClick() {
  document.getElementById('customMenuMismatch').style.display = 'none';
  document.body.style.overflow = "auto";
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

  <div v-if="loading" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.3); z-index: 2000;">
    <div class="modal-dialog modal-dialog-centered">
      <div class="modal-content border-0 shadow-none bg-transparent">
        <div class="alert alert-primary text-center mb-0" style="font-size:1.2rem;">
          <div class="spinner-border text-primary mb-2" role="status" style="width:2.5rem; height:2.5rem;">
            <span class="visually-hidden">Loading...</span>
          </div>
          <div>Test SSH des sites en cours ...</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Message d'erreur -->
  <div v-if="error" class="alert alert-danger">
    {{ error }}
    <button @click="loadCredentials" class="btn btn-sm btn-outline-danger ms-2">
      Retry
    </button>
  </div>

  <div class="p-4 rounded">
    <div v-if="noMismatchMessage" class="alert alert-success mt-4">
      {{ noMismatchMessage }}
    </div>

    <div v-if="syncResult?.mismatches?.length" class="mt-4">
      <div class="card p-4 shadow-sm d-flex justify-content-center pb-3 ">
        <div class="card-header d-flex align-items-center justify-content-between text-uppercase">
          <h5 class="mb-0">Statistics</h5>
          <small class="text-muted">Synced: {{ matchedCount }} / {{ totalSites }}</small>
        </div>
        <div class="card-body">
            <div class="kpi-grid">
              <div class="kpi-card safe" style="transform: translateY(6px)">
                <div>
                  <div class="label">Total Sites Synced</div>
                  <div class="value">{{ totalSites }}</div>
                </div>
                <i class="bi bi-hdd-network text-primary" style="font-size: 1.5rem;"></i>
              </div>
              <div class="kpi-card teal" style="transform: translateY(6px)">
                <div>
                  <div class="label">Matches</div>
                  <div class="value">{{ matchedCount }}</div>
                </div>
                <i class="bi bi-shield-check text-primary" style="font-size: 1.5rem;"></i>
              </div>
              <div class="kpi-card warn" style="transform: translateY(6px)">
                <div>
                  <div class="label">Mismatches</div>
                  <div class="value">{{ mismatchCount }}</div>
                </div>
                <i class="bi bi-shield-exclamation text-warning" style="font-size: 1.5rem;"></i>
              </div>
            </div>
          <StatsRings :usernamePct="usernamePct" :passwordPct="passwordPct" :portPct="portPct" />
        </div>
        <div class="card-header bg-danger text-white d-flex align-items-center justify-content-between text-uppercase">
          <h5 class="mb-0">Sites Issues ({{ syncResult.mismatches.length }})</h5>
        </div>
        <div class="card-body">
          <div class="text-end mt-3 justify-content-center m-3">
            <button class="btn btn-m btn-primary" @click="getSelectedRows">
              <i class="bi bi-pencil-square">Update Credentials</i>
            </button>
          <div class="text-end mt-3 justify-content-center m-3" v-if="showSaveButton">
            <button class="btn btn-success" @click="saveUpdates">
              <i class="bi bi-save"></i> Save {{ selectedRows.length }} modification(s)
            </button>
          </div>

          </div>
          <div class="mismatch-grid-container" style="max-height: 380px; overflow: auto;">
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
  <ul id="customMenu" class="mb-2 rounded small"
      style="position:fixed; display:none; background:white; border:1px solid #ccc; box-shadow:0 2px 6px rgba(0,0,0,0.15); list-style:none; padding:5px; margin:0; z-index:1000; min-width:160px;">
    
    <li class="text-end mb-1">
      <button class="btn btn-sm btn-link p-0 text-muted" type="button" id="btn-close-menu-mismatch" @click="onCustomMenuCloseClick">
        <i class="bi bi-x"></i>
      </button>
    </li>
    <li id="menu-delete" style="padding:2px;">
      <button class="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-start" 
              type="button" id="btn-delete-mismatch" @click="onCustomMenuUpdateClick" :disabled="!selectedRows.length">
        <i class="bi bi-pencil-square me-2"></i> Update
      </button>
    </li>
    <li id="menu-sync" style="padding:2px;">
      <button class="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-start" 
              type="button" id="btn-sync-mismatch" @click="runTestSelectedCredentials" :disabled="!selectedRows.length || loading">
        <i class="bi bi-plug me-2"></i> Test connexion
      </button>
    </li>
  </ul>

  <!-- Custom menu mismatch -->
  <ul id="customMenuMismatch" class="mb-2 rounded small"
      style="position:fixed; display:none; background:white; border:1px solid #ccc; box-shadow:0 2px 6px rgba(0,0,0,0.15); list-style:none; padding:5px; margin:0; z-index:1000; min-width:160px;">
    
    <li class="text-end mb-1">
      <button class="btn btn-sm btn-link p-0 text-muted" type="button" id="btn-close-menu-mismatch" @click="onCustomMenuMismatchCloseClick">
        <i class="bi bi-x"></i>
      </button>
    </li>
    <li id="menu-details-mismatch" style="padding:2px;">
      <button class="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-start"
              type="button" id="btn-details-mismatch" @click="onCustomMenuMismatchDetailsClick">
        <i class="bi bi-info-circle me-2"></i> Show details
      </button>
    </li>
    <li id="menu-delete-mismatch" style="padding:2px;">
      <button class="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-start"
              type="button" id="btn-delete-mismatch" @click="onCustomMenuMismatchUpdateClick" :disabled="!selectedRows.length">
        <i class="bi bi-pencil-square me-2"></i> Update
      </button>
    </li>
    <li id="menu-sync-mismatch" style="padding:2px;">
      <button class="btn btn-sm btn-light w-100 d-flex align-items-center justify-content-start"
              type="button" id="btn-sync-mismatch" @click="runTestSelectedCredentials" :disabled="!selectedRows.length || loading">
        <i class="bi bi-plug me-2"></i> Test connexion
      </button>
    </li>
  </ul>



<div class="p-4 rounded pb">
  <div class="card p-4 shadow-sm d-flex justify-content-center pb-3">
    <div class="card-header d-flex align-items-center justify-content-between text-uppercase">
      <h5 class="mb-0">List Sites <span class="badge bg-light text-primary ms-2">{{ filteredCredentials.length }}</span></h5>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-primary" @click="handleExport">
          <i class="bi bi-download"></i> Export
        </button>
        <button class="btn btn-outline-primary" @click="toggleSelectAll">
          {{ allSelected ? 'Unselect All' : 'Select All' }}
        </button>
        <button class="btn btn-ghost" @click="loadCredentials" :disabled="loading">
          <span v-if="loading" class="spinner-border spinner-border-sm me-2"></span>
          <i v-else class="bi bi-arrow-clockwise me-2"></i>
          Reload
        </button>
      </div>
    </div>
    
    <div class="row g-3 p-3 align-items-center">
      <div class="col-12 col-lg-6">
        <div class="input-group">
          <span class="input-group-text bg-white border-0"><i class="bi bi-search"></i></span>
          <input
            v-model="searchQuery"
            class="form-control"
            placeholder="Search by ID, IP, Site, Username, Port..."
            @input="applySearch"
          />
          <button class="btn btn-outline-secondary" v-if="searchQuery" @click="clearSearch">Clear</button>
        </div>
      </div>
      <div class="col-12 col-lg-6 text-lg-end" v-if="selectedRows.length">
        <small class="text-muted">Selected rows: {{ selectedRows.length }}</small>
      </div>
    </div>

    <div v-if="!filteredCredentials.length && !loading" class="p-4 text-center text-muted">
      No results. Try adjusting your search.
      </div>
      
    <div v-else class="col-12">
        <div class="card-body p-4 menu-grid-container">
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

  <div
    v-if="showMismatchModal"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.3)"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header bg-warning">
          <h5 class="modal-title">Mismatch details- Site #{{ currentMismatch?.id }}</h5>
          <button type="button" class="btn-close" @click="showMismatchModal = false"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            <h6>Problemes detected :</h6>
            <ul>
              <li v-if="!currentMismatch?.usernameMatch">❌ Username mismatch</li>
              <li v-if="!currentMismatch?.passwordMatch">❌ Password mismatch</li>
              <li v-if="!currentMismatch?.portMatch">❌ Port mismatch</li>
            </ul>
          </div>
          <div class="alert alert-info">
            <h6>Recommended actions :</h6>
            <p>Please check and update the site information</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-primary" @click="showMismatchModal = false">Close</button>
        </div>
      </div>
    </div>
  </div>


  <!-- Modal d'édition -->
  <div
    v-if="showModal"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0, 0, 0, 0.3)"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title text-uppercase">Update sites</h5>
          <button type="button" class="btn-close" @click="closeFormModal"></button>
        </div>
        <div class="modal-body">
          <div class="mb-2">
            <label>IP (Selected sites)</label>
            <textarea
              class="form-control"
              rows="3"
              readonly
            >{{ selectedRows.map(row => row.Ip).join('\n') }}</textarea>
          </div>
          <div class="mb-2">
            <label>siteUsername</label><input v-model="formValues.username" class="form-control" type="text" />
          </div>
          <div class="mb-2">
            <label>sitePassword</label><input v-model="formValues.password" class="form-control" type="password" />
          </div>
          <div class="mb-2">
            <label>sitePort</label><input v-model="formValues.port" class="form-control" type="number" min="0" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-success" @click="runTestFormCredentials()" :disabled="!isFormComplete">
            Test form values
          </button>
          <button class="btn btn-success" @click="updateSelectedCredentials(formValues)">
            Update selected sites
          </button>
          <button class="btn btn-secondary" @click="closeFormModal">Cancel</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Export CSV -->
  <div v-if="showExportModal" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.3)">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">Exporter en CSV</h5>
          <button type="button" class="btn-close" @click="cancelExport"></button>
        </div>
        <div class="modal-body">
          <label for="csvFileName">Nom du fichier :</label>
          <input id="csvFileName" v-model="exportFileName" class="form-control" placeholder="export.csv" />
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelExport">Annuler</button>
          <button class="btn btn-success" @click="confirmExport">Exporter</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modal Success -->
  <div
    v-if="showSuccessModal"
    class="modal fade show d-block"
    tabindex="-1"
    style="background: rgba(0,0,0,0.3)"
  >
    <div class="modal-dialog" style="max-width: 420px;">
      <div
        class="modal-content text-center p-4 border-0 rounded-4"
        style="
          background: linear-gradient(135deg, #ffffffcc, #f8f9facc);
          backdrop-filter: blur(10px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        "
      >
        <i class="bi bi-check-circle-fill text-success" style="font-size: 2.5rem;"></i>
        <h6 class="mt-3 mb-2 fw-bold">Succès</h6>
        <p class="text-muted mb-3">{{ successMessage }}</p>
        <button class="btn btn-success btn-sm px-4 rounded-pill shadow-sm" @click="closeSuccessModal">
          OK
        </button>
      </div>
    </div>
  </div>


</template>