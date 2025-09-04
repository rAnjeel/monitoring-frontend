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
  <div class="panel panel-default" style="margin-top:20px; box-shadow:0 2px 6px rgba(0,0,0,0.1);">
    <div class="panel-body text-center">
      <div class="row" style="margin-bottom:15px;">
        
        <!-- Username -->
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.usernamePct)">
            <span class="ring-icon glyphicon glyphicon-user"></span>
            <span class="ring-value">{{ props.usernamePct }}%</span>
          </div>
          <div class="ring-label">Valid Usernames</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.usernamePct)">
            {{ props.usernamePct }}%
          </div>
        </div>

        <!-- Password -->
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.passwordPct)">
            <span class="ring-icon glyphicon glyphicon-lock"></span>
            <span class="ring-value">{{ props.passwordPct }}%</span>
          </div>
          <div class="ring-label">Valid Passwords</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.passwordPct)">
            {{ props.passwordPct }}%
          </div>
        </div>

        <!-- Port -->
        <div class="col-md-4">
          <div class="ring" :style="ringStyle(props.portPct)">
            <span class="ring-icon glyphicon glyphicon-hdd"></span>
            <span class="ring-value">{{ props.portPct }}%</span>
          </div>
          <div class="ring-label">Valid Ports</div>
          <div class="ring-value-top gradient" :style="ringStyle(props.portPct)">
            {{ props.portPct }}%
          </div>
        </div>

      </div>
    </div>
  </div>
</template>
