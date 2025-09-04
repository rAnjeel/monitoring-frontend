import { createApp } from 'vue';
import App from './App.vue';
import router from './router';


createApp(App)
  .use(router)
  .mount('#app'); // Assure-toi que <div id="app"></div> existe dans index.html
