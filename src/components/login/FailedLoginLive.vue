<template>
  <div class="p-4 bg-gray-100 min-h-screen">
    <h1 class="text-lg font-bold">Failed login attempts (live)</h1>
    <div class="mt-4 space-y-3">
      <div
        v-for="(item, index) in failedLogins"
        :key="index"
        class="bg-white rounded-lg p-3 shadow-sm"
      >
        <div>
          <strong>{{ item.siteUsername || 'unknown' }}</strong>
          — <span class="text-gray-500">{{ item.Ip }}</span>
        </div>
        <div class="text-gray-500 text-sm">
          {{ item.usernameMatch ? 'Username ok' : 'Username fail' }},
          {{ item.passwordMatch ? 'Password ok' : 'Password fail' }},
          {{ item.portMatch ? 'Port ok' : 'Port fail' }}
        </div>
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
