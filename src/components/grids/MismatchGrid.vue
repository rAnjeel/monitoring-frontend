<script setup>
  import { AgGridVue } from 'ag-grid-vue3'
</script>

<template>
  <ag-grid-vue
    style="width: 100%; height: 360px;"
    class="ag-theme-quartz"
    :rowHeight="40"
    :headerHeight="44"
    rowSelection="multiple"
    :rowMultiSelectWithClick="true"
    suppressCellFocus="true"
  />
</template>


