/* eslint-disable */
<script setup>
  import '../../assets/main.css'
</script>

<template>
  <div class="p-3 rounded">
    <div class="dashboard-header">
      <div class="d-flex align-items-center justify-content-between">
        <div>
          <div class="breadcrumbs">
            <span class="crumb">Monitoring</span>
            <span class="sep">/</span>
            <span class="crumb">Failed logins</span>
          </div>
          <h3 class="mt-2 mb-0 text-gradient">Failed login attempts (live)</h3>
          <small class="text-muted">
            Last update:
            {{ failedLogins.length ? new Date().toLocaleString() : "—" }}
          </small>
        </div>
      </div>
    </div>

    <div v-if="!failedLogins.length" class="alert alert-success mt-4">
      No failed logins detected.
    </div>

    <div v-else class="mt-4">
      <div
        v-for="(item, index) in failedLogins"
        :key="index"
        class="card shadow-sm mb-3"
      >
        <div class="card-body">
          <div class="row g-3">
            <!-- Colonne gauche : infos IP -->
            <div class="col-md-6">
              <div class="d-flex flex-column h-100">
                <div class="fw-semibold text-danger mb-2 text-truncate">
                  Failed login — IP: {{ item.userIp || "unknown" }}
                </div>
                <div class="mt-auto">
                  <p class="mb-1 small text-truncate">
                    <strong class="text-nowrap">Site IP:</strong> 
                    <span class="ms-1">{{ item.siteIp || "unknown" }}</span>
                  </p>
                  <p class="mb-0 small text-truncate">
                    <strong class="text-nowrap">User IP:</strong> 
                    <span class="ms-1">{{ item.ip || "unknown" }}</span>
                  </p>
                </div>
              </div>
            </div>

            <!-- Colonne droite : détails techniques -->
            <div class="col-md-6">
              <div class="border-start ps-3 h-100">
                <h6 class="fw-bold mb-2 small text-truncate">Technical details</h6>
                <ul class="list-unstyled mb-0">
                  <li class="d-flex align-items-center mb-1">
                    <span class="text-nowrap small" style="width: 80px;">Username:</span>
                    <span :class="item.details.usernameMatch ? 'text-success' : 'text-danger'" class="small ms-2">
                      {{ item.details.usernameMatch ? "✓ Match" : "✗ Mismatch" }}
                    </span>
                  </li>
                  <li class="d-flex align-items-center mb-1">
                    <span class="text-nowrap small" style="width: 80px;">Password:</span>
                    <span :class="item.details.passwordMatch ? 'text-success' : 'text-danger'" class="small ms-2">
                      {{ item.details.passwordMatch ? "✓ Match" : "✗ Mismatch" }}
                    </span>
                  </li>
                  <li class="d-flex align-items-center">
                    <span class="text-nowrap small" style="width: 80px;">Port:</span>
                    <span :class="item.details.portMatch ? 'text-success' : 'text-danger'" class="small ms-2">
                      {{ item.details.portMatch ? "✓ Match" : "✗ Mismatch" }}
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>

export default {
  name: "FailedLoginLive",
  data() {
    return {
      failedLogins: [],
    };
  },
};
</script>
