<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <h3 class="text-lg font-bold">Failed login attempts (live)</h3>
    <div
      v-for="(item, index) in failedLogins"
      :key="index"
      class="bg-white rounded-lg p-3 shadow-sm mb-2"
    >
      <h5 class="font-bold text-lg mb-2 text-red-500">
        Tentative de connexion ({{ item.siteIp || 'failed' }}) - IP: {{ item.ip }}
      </h5>

      <div v-if="item.details" class="mt-2">
        <p class="font-semibold">Détails techniques :</p>
        <ul class="ml-4">
          <li v-for="(detailValue, detailKey) in item.details" :key="detailKey">
            {{ detailKey }}: <span :class="detailValue ? 'text-green-500' : 'text-red-500'">
              {{ detailValue ? '✓' : '✗' }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import socketService from "../../services/socketService";

export default {
  name: "FailedLoginLive",
  data() {
    return {
      failedLogins: [],
    };
  },
  mounted() {
    const socket = socketService.connect();

    socketService.on("failed_login", (payload) => {
      console.log("Échec de connexion reçu:", payload);
      this.failedLogins.unshift(payload);
    });
  },
  beforeUnmount() {
    socketService.disconnect();
  },
};
</script>
