<script setup>

</script>

<template>
  <div id="app">
    <nav class="navbar navbar-inverse">
      <div class="container-fluid">
        <!-- Logo / Brand -->
        <div class="navbar-header">
          <button
            type="button"
            class="navbar-toggle collapsed"
            data-toggle="collapse"
            data-target="#navbarContent"
            aria-expanded="false"
          >
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="/">Monitoring</a>
        </div>

        <!-- Liens du menu -->
        <div class="collapse navbar-collapse" id="navbarContent">
          <ul class="nav navbar-nav navbar-right">
            <li>
              <router-link to="/" class="nav-link">
                <i class="bi bi-house-door"></i> Accueil
              </router-link>
            </li>
            <li>
              <router-link to="/import-csv" class="nav-link">
                <i class="bi bi-arrow-down"></i> Import CSV
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Zone de rendu des routes -->
    <router-view />
  </div>
</template>
