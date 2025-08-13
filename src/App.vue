<script setup>
import CredentialSite from './CredentialSite.vue'
import CsvImport from './CsvImport.vue'
import HeaderNavbar from './HeaderNavbar.vue'

</script>

<template>
  <div id="app">
    <nav>
      <router-link to="/">Accueil</router-link> |
      <router-link to="/failed-logins">Failed Logins</router-link>
    </nav>

    <!-- C’est ici que Vue affiche la page en fonction de la route -->
    <router-view />
  </div>
</template>