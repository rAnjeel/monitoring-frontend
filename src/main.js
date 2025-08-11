import { createApp } from 'vue'
import App from './App.vue'
// All Community Features
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

createApp(App).mount('#app')
