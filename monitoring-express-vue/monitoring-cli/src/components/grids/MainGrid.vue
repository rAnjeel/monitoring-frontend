<script setup>
import { AgGridVue } from 'ag-grid-vue3';

</script>

<template>
  <AgGridVue
    class="ag-theme-quartz"
    style="width: 100%; height: 420px"
    :rowHeight="42"
    :headerHeight="46"
    rowSelection="multiple"
    :rowMultiSelectWithClick="true"
    suppressCellFocus="true"
  />
</template>


