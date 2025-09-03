import { createRouter, createWebHistory } from 'vue-router';
import FailedLoginLive from '../components/login/FailedLoginLive.vue';
import CredentialSite from '../CredentialSite.vue'
import CsvImport from '../CsvImport.vue'
import NotFound from '@/components/NotFound.vue';

const routes = [
    {
        path: '/',
        name: 'CredentialSite',
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
    },
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('../components/NotFound.vue')
    }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
