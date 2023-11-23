<script setup lang="ts">
import { Ref, ref } from 'vue';
import Bran from './Bran.vue';
import Hodor from './Hodor.vue';
import { info_t, LEVEL } from './log';
import { now, useTimeoutFn, useUrlSearchParams } from '@vueuse/core';

const searchParams = useUrlSearchParams();
const role = (searchParams.role as string)?.toLowerCase() == 'lord' ? Bran : Hodor;
const name = searchParams.n as (string | undefined);
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
      <component :is="role" @msg="pushMessage" :name="name">
      </component>
      <Transition name="popup">
        <div v-show="msgShow" class="w-full">
          <progress class="progress" :max="stopTime - startTime" :value="progress"></progress>
          <div :class="'hyphens-auto alert ' + MAP_INFO_LEVEL.get(msgLevel)">
            {{ msg }}
          </div>
        </div>
      </Transition>
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
