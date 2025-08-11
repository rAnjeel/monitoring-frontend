<script setup>
import { ref, defineEmits, defineProps } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
const emit = defineEmits(['ready', 'cellClicked', 'cellValueChanged'])

const props = defineProps({
  rowData: { type: Array, default: () => [] },
  columnDefs: { type: Array, required: true },
  defaultColDef: { type: Object, required: true },
  getRowClass: { type: Function, default: () => '' },
  getContextMenuItems: { type: Function, default: null }
})

const gridRefMismatch = ref(null)

function onGridReady(params) {
  gridRefMismatch.value = params.api
  emit('ready', params)
}

function onCellClicked(params) {
  emit('cellClicked', params)
}

function onCellValueChanged(params) {
  emit('cellValueChanged', params)
}
</script>

<template>
  <ag-grid-vue
    ref="gridRefMismatch"
    style="width: 100%; height: 360px;"
    class="ag-theme-quartz"
    :defaultColDef="props.defaultColDef"
    :rowData="props.rowData"
    :columnDefs="props.columnDefs"
    :getRowClass="props.getRowClass"
    :rowHeight="40"
    :headerHeight="44"
    :getContextMenuItems="props.getContextMenuItems"
    suppressCellFocus="true"
    @cellClicked="onCellClicked"
    @grid-ready="onGridReady"
    @cell-value-changed="onCellValueChanged"
  />
</template>


