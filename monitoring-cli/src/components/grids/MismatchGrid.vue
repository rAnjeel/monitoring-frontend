<script setup>
  import { AgGridVue } from 'ag-grid-vue3'
</script>

<template>
  <AgGridVue
    style="width: 100%; height: 220px;"
    class="ag-theme-quartz"
    :rowHeight="40"
    :headerHeight="44"
    rowSelection="multiple"
    :rowMultiSelectWithClick="true"
    suppressCellFocus="true"
  />
</template>


