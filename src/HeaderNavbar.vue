<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-dark px-4 text-uppercase">
    <a class="navbar-brand fw-bold" href="#">Monitoring</a>

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

    <div class="collapse navbar-collapse" id="navbarContent">
      <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
        <li class="nav-item">
          <a class="nav-link active" href="#"><i class="bi bi-house-door"></i> Accueil</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#"><i class="bi bi-server"></i> Serveurs</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#"><i class="bi bi-gear"></i> Paramètres</a>
        </li>
        <li class="nav-item">
          <a class="nav-link text-danger" href="#"><i class="bi bi-box-arrow-right"></i> Déconnexion</a>
        </li>
      </ul>
    </div>
  </nav>
</template>

<script setup>
// Pas besoin de logique JS pour l’instant
</script>

