<script setup lang="ts">
import Bran from './Bran.vue';
import Hodor from './Hodor.vue';
</script>

<template>
  <div class="card w-96 shadow-2xl card-bordered">
    <div class="card-body w-full">
      <div class="tabs tabs-bordered tabs-lg">
        <input type="radio" name="tab" class="tab" aria-label="HODOR" checked />
        <div class="tab-content">
          <Hodor></Hodor>
        </div>
        <input type="radio" name="tab" class="tab" aria-label="BRAN" />
        <div class="tab-content">
          <Bran></Bran>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
