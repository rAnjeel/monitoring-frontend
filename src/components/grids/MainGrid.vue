<script setup>
import { defineEmits, defineProps, ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'

const emit = defineEmits(['ready', 'cellClicked'])

const props = defineProps({
  rowData: { type: Array, default: () => [] },
  columnDefs: { type: Array, required: true },
  defaultColDef: { type: Object, required: true },
  getRowClass: { type: Function, default: () => '' },
  getContextMenuItems: { type: Function, default: null }
})

const gridRef = ref(null)

function onGridReady(params) {
  gridRef.value = params.api
  emit('ready', params)
}

function onCellClicked(params) {
  emit('cellClicked', params)
}
</script>

<template>
  <ag-grid-vue
    ref="gridRef"
    class="ag-theme-quartz"
    style="width: 100%; height: 420px"
    :rowData="props.rowData"
    :columnDefs="props.columnDefs"
    :defaultColDef="props.defaultColDef"
    :getRowClass="props.getRowClass"
    :rowHeight="42"
    :headerHeight="46"
    rowSelection="multiple"
    :rowMultiSelectWithClick="true"
    :suppressRowClickSelection="true"
    :getContextMenuItems="props.getContextMenuItems"
    @cellClicked="onCellClicked"
    suppressCellFocus
    :animateRows="true"
    :components="{ ButtonRenderer }"
    @grid-ready="onGridReady"
  />
</template>


