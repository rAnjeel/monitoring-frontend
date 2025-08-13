import { createRouter, createWebHistory } from 'vue-router';
import FailedLoginLive from '../components/login/FailedLoginLive.vue';
import CredentialSite from '../CredentialSite.vue'
import CsvImport from '../CsvImport.vue'

const routes = [
    {
        path: '/',
        name: 'CredensialSite',
        component: CredentialSite
    },
    {
        path: '/failed-logins',
        name: 'FailedLoginLive',
        component: FailedLoginLive
    },
    {
        path: '/import-csv',
        name: 'CsvImport',
        component: CsvImport
    }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
