<script setup lang="ts">
import { ref } from 'vue';
import Bran from './Bran.vue';
import Hodor from './Hodor.vue';

const who = [ref(true), ref(false)];
function activate(id: number) {
  who.forEach(x => x.value = false);
  who[id].value = true;
}
</script>

<template>
  <div class="card w-80 shadow-2xl card-bordered">
    <div class="card-body w-full">
      <div v-if="who[0].value">
        <Hodor></Hodor>
      </div>
      <div v-if="who[1].value">
        <Bran></Bran>
      </div>
    </div>
  </div>
  <div class="btm-nav btm-nav-lg">
    <button :class="who[0].value ? 'is-active' : 'is-inactive'" @click="activate(0)">
      HODOR
    </button>
    <button :class="who[1].value ? 'is-active' : 'is-inactive'" @click="activate(1)">
      BRAN
    </button>
  </div>
</template>

<style scoped lang="postcss">
.is-active {
  @apply active font-bold;
}

.is-inactive {
  @apply text-secondary;
}
</style>
