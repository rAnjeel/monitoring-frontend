<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  usernamePct: { type: Number, default: 0 },
  passwordPct: { type: Number, default: 0 },
  portPct: { type: Number, default: 0 }
})

function ringStyle(pct) {
  const isFull = Number(pct) === 100
  const start = isFull ? '#469fb1' : '#646f79'
  const end = isFull ? '#34A0B0' : '#646f79'
  return {
    '--pct': pct,
    '--colorStart': start,
    '--colorEnd': end
  }
}
</script>

<template>
  <div class="card mt-4 d-flex justify-content-center pb-3 ">
    
    <div class="card-body">
      <div class="row g-3 align-items-stretch text-center">
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.usernamePct)">
            <span class="ring-icon bi bi-person-check" aria-hidden="true"></span>
            <span class="ring-value">{{ props.usernamePct }}%</span>
          </div>
          <div class="ring-label">Valid Usernames</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.usernamePct)">{{ props.usernamePct }}%</div>
        </div>
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.passwordPct)">
            <span class="ring-icon bi bi-shield-lock" aria-hidden="true"></span>
            <span class="ring-value">{{ props.passwordPct }}%</span>
          </div>
          <div class="ring-label">Valid Passwords</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.passwordPct)">{{ props.passwordPct }}%</div>
        </div>
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.portPct)">
            <span class="ring-icon bi bi-ethernet" aria-hidden="true"></span>
            <span class="ring-value">{{ props.portPct }}%</span>
          </div>
          <div class="ring-label">Valid Ports</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.portPct)">{{ props.portPct }}%</div>  
        </div>
      </div>
    </div>
  </div>
</template>


