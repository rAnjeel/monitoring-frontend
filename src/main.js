import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

// All Community Features
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

createApp(App).use(router).mount('#app')
