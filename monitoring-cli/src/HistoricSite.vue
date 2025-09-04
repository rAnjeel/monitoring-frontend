<script setup>
import { ref } from 'vue'

// Données fictives pour l'exemple
const currentErrors = ref([
  {
    id: 1,
    errorDescription: 'Username mismatch',
    connectionErrorDate: '2024-07-01T10:00:00Z',
    errorStatus: 'unresolved',
  },
  {
    id: 2,
    errorDescription: 'Password mismatch',
    connectionErrorDate: '2024-07-02T12:00:00Z',
    errorStatus: 'unresolved',
  },
])

const recentErrors = ref([
  {
    id: 3,
    errorDescription: 'Port mismatch',
    connectionErrorDate: '2024-06-28T09:00:00Z',
    errorResolutionDate: '2024-06-29T11:00:00Z',
    errorStatus: 'resolved',
  },
  {
    id: 4,
    errorDescription: 'Username mismatch',
    connectionErrorDate: '2024-06-20T15:00:00Z',
    errorResolutionDate: '2024-06-21T10:00:00Z',
    errorStatus: 'resolved',
  },
])

const showForm = ref(false)
const selectedError = ref(null)

function openForm(error) {
  selectedError.value = error
  showForm.value = true
}
function closeForm() {
  showForm.value = false
  selectedError.value = null
}
</script>

<template>
  <div class="container mt-4">
    <h3>Historique des erreurs du site</h3>

    <div v-if="currentErrors.length">
      <h5 class="text-danger">Erreurs actuelles non résolues</h5>
      <ul class="list-group mb-4">
        <li v-for="err in currentErrors" :key="err.id" class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <strong>{{ err.errorDescription }}</strong>
            <span class="text-muted ms-2">({{ new Date(err.connectionErrorDate).toLocaleString() }})</span>
          </div>
          <button class="btn btn-sm btn-primary" @click="openForm(err)">Résoudre / Commenter</button>
        </li>
      </ul>
    </div>

    <div v-else>
      <h5 class="text-secondary">Aucune erreur actuelle</h5>
      <div v-if="recentErrors.length">
        <h6 class="mt-3">Erreurs des 5 derniers jours ou 2 semaines précédentes</h6>
        <ul class="list-group mb-4">
          <li v-for="err in recentErrors" :key="err.id" class="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{{ err.errorDescription }}</strong>
              <span class="text-muted ms-2">({{ new Date(err.connectionErrorDate).toLocaleString() }})</span>
              <span v-if="err.errorResolutionDate" class="badge bg-success ms-2">Résolue le {{ new Date(err.errorResolutionDate).toLocaleDateString() }}</span>
            </div>
            <button class="btn btn-sm btn-outline-primary" @click="openForm(err)">Voir / Commenter</button>
          </li>
        </ul>
      </div>
      <div v-else class="alert alert-success">Aucune erreur récente détectée.</div>
    </div>

    <!-- Modal/Formulaire -->
    <div v-if="showForm" class="modal fade show d-block" tabindex="-1" style="background: rgba(0,0,0,0.3)">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Détail de l'erreur</h5>
            <button type="button" class="btn-close" @click="closeForm"></button>
          </div>
          <div class="modal-body">
            <p><strong>Erreur :</strong> {{ selectedError?.errorDescription }}</p>
            <p><strong>Date :</strong> {{ new Date(selectedError?.connectionErrorDate).toLocaleString() }}</p>
            <div v-if="selectedError?.errorResolutionDate">
              <p><strong>Résolue le :</strong> {{ new Date(selectedError?.errorResolutionDate).toLocaleString() }}</p>
            </div>
            <textarea class="form-control" placeholder="Ajouter un commentaire..."></textarea>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" @click="closeForm">Fermer</button>
            <button class="btn btn-success">Enregistrer</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  display: block;
}
</style>