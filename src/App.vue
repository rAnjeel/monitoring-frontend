<script setup>

</script>

<template>
  <div id="app">
    <!-- <nav>
      <router-link to="/">Accueil</router-link> |
      <router-link to="/failed-logins">Failed Logins</router-link>
    </nav> -->
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-4 text-uppercase align-items-center">

      <div class="collapse navbar-collapse d-flex align-items-center" id="navbarContent">
      <a class="navbar-brand fw-bold d-flex align-items-center" href="#">Monitoring</a>

      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarContent"
        aria-controls="navbarContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <ul class="navbar-nav ms-auto mb-2 mb-lg-0 d-flex align-items-center">
        <li class="nav-item d-flex align-items-center">
        <router-link to="/" class="nav-link active d-flex align-items-center" href="#"><i class="bi bi-house-door"></i> <span class="ms-1">Home</span></router-link>
        </li>
        <li class="nav-item d-flex align-items-center">
        <router-link to="/failed-logins" class="nav-link d-flex align-items-center" href="#"><i class="bi bi-server"></i> <span class="ms-1">Logs</span></router-link>
        </li>
        <li class="nav-item d-flex align-items-center">
        <router-link to="/import-csv" class="nav-link d-flex align-items-center" href="#"><i class="bi bi-arrow-down"></i> <span class="ms-1">Import CSV</span></router-link>
        </li>
        <li class="nav-item d-flex align-items-center">
        <a class="nav-link d-flex align-items-center" href="#"><i class="bi bi-gear"></i> <span class="ms-1">Settings</span></a>
        </li>
        <li class="nav-item d-flex align-items-center">
        <a class="nav-link text-danger d-flex align-items-center" href="#"><i class="bi bi-box-arrow-right"></i> <span class="ms-1">Disconnect</span></a>
        </li>
      </ul>
      </div>
    </nav>

    <!-- C’est ici que Vue affiche la page en fonction de la route -->
    <router-view />
  </div>
</template>