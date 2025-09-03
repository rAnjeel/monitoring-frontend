<template>
  <div class="notfound-page">
    <div class="container text-center">
      <div class="row vertical-center">
        <div class="col-sm-10 col-sm-offset-1 col-md-8 col-md-offset-2">
          <div class="card shadowed">
            <div class="illustration" aria-hidden="true">
              <!-- simple SVG hero illustration -> modern and lightweight -->
              <svg viewBox="0 0 800 400" preserveAspectRatio="xMidYMid meet" class="hero-svg">
                <defs>
                  <linearGradient id="g1" x1="0" x2="1">
                    <stop offset="0%" stop-color="#6f42c1" stop-opacity="0.95"/>
                    <stop offset="100%" stop-color="#20a8d8" stop-opacity="0.95"/>
                  </linearGradient>
                </defs>
                <rect x="0" y="0" width="100%" height="100%" rx="10" fill="url(#g1)" />
                <g transform="translate(60,50) scale(0.8)">
                  <g class="floating" transform="translate(160,40)">
                    <circle cx="120" cy="80" r="60" fill="#fff" opacity="0.06"/>
                    <g transform="translate(80,40)">
                      <text x="0" y="0" class="big-num">404</text>
                    </g>
                  </g>
                </g>
              </svg>
            </div>

            <div class="content">
              <h1 class="title">Page introuvable</h1>
              <p class="lead">Désolé — la page que vous recherchez n'existe pas ou a été déplacée.</p>

              <div class="actions row">
                <div class="col-xs-12 col-sm-6">
                  <a class="btn btn-primary btn-lg btn-block" @click.prevent="goHome" href="#">Revenir à l'accueil</a>
                </div>

                <div class="col-xs-12 col-sm-6">
                  <form class="search-form" @submit.prevent="onSearch">
                    <div class="input-group input-group-lg">
                      <input v-model="q" type="search" class="form-control" placeholder="Rechercher sur le site" aria-label="Rechercher">
                      <span class="input-group-btn">
                        <button class="btn btn-default" type="submit">Rechercher</button>
                      </span>
                    </div>
                  </form>
                </div>

              </div>

              <p class="muted small">Si vous pensez que c'est une erreur, <a href="mailto:support@example.com">contactez le support</a>.</p>
            </div>

          </div>
        </div>
      </div>

      <footer class="nf-footer text-muted">
        <small>© {{ year }} — Tous droits réservés</small>
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  data() {
    return {
      q: '',
      year: new Date().getFullYear(),
    }
  },
  methods: {
    goHome() {
      // si vous utilisez vue-router
      if (this.$router) {
        this.$router.push('/')
        return
      }
      // sinon fallback classique
      window.location.href = '/'
    },
    onSearch() {
      // implémentez la logique de recherche que vous avez (ex: route vers /search?q=...)
      const query = (this.q || '').trim()
      if (!query) {
        return
      }
      if (this.$router) {
        this.$router.push({ path: '/search', query: { q: query } })
      } else {
        window.location.href = `/search?q=${encodeURIComponent(query)}`
      }
    }
  }
}
</script>

<style scoped>
/* Utilise Bootstrap 3 classes mais ajoute un style moderne et épuré */
.notfound-page {
  min-height: 70vh;
  display: flex;
  align-items: center;
  padding: 40px 0;
  background: linear-gradient(180deg, #f7fbff 0%, #ffffff 100%);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial;
}
.vertical-center { min-height: 60vh; display:flex; align-items:center; }
.card {
  background: white;
  border-radius: 12px;
  padding: 30px;
  border: 0;
}
.shadowed {
  -webkit-box-shadow: 0 10px 30px rgba(34,34,34,0.06);
  box-shadow: 0 10px 30px rgba(34,34,34,0.06);
}
.illustration { max-height: 200px; overflow: hidden; border-radius: 8px; margin-bottom: 18px; }
.hero-svg { width: 100%; height: auto; display:block; }
.big-num {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  font-size: 110px;
  fill: rgba(255,255,255,0.96);
  font-weight: 700;
  text-anchor: middle;
}
.title {
  font-size: 34px;
  margin: 8px 0 6px;
  letter-spacing: -0.4px;
}
.lead {
  color: #6c757d;
  margin-bottom: 20px;
}
.actions { margin-top: 16px; }
.search-form .form-control { border-radius: 40px 0 0 40px; }
.search-form .btn { border-radius: 0 40px 40px 0; }
.btn-block { border-radius: 40px; }
.muted { color: #8a8f98; }
.nf-footer { margin-top: 18px; }

/* subtle animations */
.floating { animation: floaty 6s ease-in-out infinite; }
@keyframes floaty {
  0% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
  100% { transform: translateY(0); }
}

/* Responsive tweaks for Bootstrap 3 */
@media (max-width: 767px) {
  .title { font-size: 28px; }
  .big-num { font-size: 72px; }
  .illustration { max-height: 140px; }
}
</style>
