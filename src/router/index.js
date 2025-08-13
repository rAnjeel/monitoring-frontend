import { createRouter, createWebHistory } from 'vue-router';
import FailedLoginLive from '../components/login/FailedLoginLive.vue';
import CredentialSite from '../CredentialSite.vue'
import CsvImport from '../CsvImport.vue'
import HeaderNavbar from '../HeaderNavbar.vue'

const routes = [
    {
        path: '/',
        name: 'CredensialSite',
    },    
    {
        path: '/failed-logins',
        name: 'FailedLoginLive',
    }, 


];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
