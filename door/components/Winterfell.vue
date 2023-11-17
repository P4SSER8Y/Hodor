<script setup lang="ts">
import { Ref, ref } from 'vue';
import Bran from './Bran.vue';
import Hodor from './Hodor.vue';
import { info_t, LEVEL } from './log';
import { now, useTimeoutFn } from '@vueuse/core';

const who = [ref(true), ref(false)];
const msgShow = ref(false);
const msg = ref("");
const msgLevel = ref(LEVEL.INFO);
const timer = useTimeoutFn(updateProgress, 30);
let startTime = ref(0)
let stopTime = ref(0)
let progress: Ref<number | undefined> = ref(0)

const MAP_INFO_LEVEL = new Map([
  [LEVEL.INFO, "level-info"],
  [LEVEL.WARNING, "level-warning"],
  [LEVEL.ERROR, "level-error"],
  [LEVEL.SUCCESS, "level-success"],
]);

function activate(id: number) {
  who.forEach(x => x.value = false);
  who[id].value = true;
  timer.stop();
  msgShow.value = false;
}

function pushMessage(info: info_t) {
  timer.stop();
  msg.value = info.msg;
  msgLevel.value = info.level;
  if (info.timeout > 0) {
    startTime.value = now();
    stopTime.value = startTime.value + info.timeout;
    timer.start();
  }
  else {
    progress.value = undefined;
  }
  msgShow.value = true;
}

function updateProgress() {
  let ts = now();
  if (ts > stopTime.value) {
    msgShow.value = false;
    return;
  }
  progress.value = stopTime.value - ts;
  timer.start();
}

</script>

<template>
  <div class="card w-80 shadow-2xl card-bordered">
    <div class="card-body w-full">
      <div v-if="who[0].value">
        <Hodor @msg="pushMessage"></Hodor>
      </div>
      <div v-if="who[1].value">
        <Bran @msg="pushMessage"></Bran>
      </div>
      <Transition name="popup">
        <div v-show="msgShow" class="w-full">
          <progress class="progress" :max="stopTime - startTime" :value="progress"></progress>
          <div :class="'hyphens-auto alert ' + MAP_INFO_LEVEL.get(msgLevel)">
            {{ msg }}
          </div>
        </div>
      </Transition>
    </div>
    <div class="btm-nav btm-nav-lg">
      <button :class="who[0].value ? 'is-active' : 'is-inactive'" @click="activate(0)">
        HODOR
      </button>
      <button :class="who[1].value ? 'is-active' : 'is-inactive'" @click="activate(1)">
        BRAN
      </button>
    </div>
  </div>
</template>

<style scoped lang="postcss">
.is-active {
  @apply active font-bold;
}

.is-inactive {
  @apply text-secondary;
}

.level-info {
  @apply alert-info;
}

.level-warning {
  @apply alert-warning;
}

.level-error {
  @apply alert-error;
}

.level-success {
  @apply alert-success;
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
}

.popup-enter-active,
.popup-leave-active {
  transition: all .5s ease;
}
</style>
