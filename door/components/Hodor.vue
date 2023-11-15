<script setup lang="ts">
import { ref } from 'vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { useLocalStorage } from '@vueuse/core'

const name = useLocalStorage('name', "");
const token = ref("");

let url_prefix = "";
if (process.env.VERCEL) {
    url_prefix = "/api/hodor/?";
}

async function auth() {
    let url = `${url_prefix}name=${name.value}`;
    const resp = await fetch(url);
    const asseResp = await startAuthentication(await resp.json());
    const verificationResp = await fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(asseResp),
    })
    const result = await verificationResp.json();
    token.value = result?.baggage?.token ?? "";
}
</script>

<template>
    <div class="grid grid-cols-1 my-2 gap-1">
        <input class="input input-bordered input-info input-lg" placeholder="name" v-model="name" />
        <button class="btn btn-outline btn-secondary btn-sm" @click="auth"></button>
        <div v-if="token.length > 0" class="break-all">
            {{ token }}
        </div>
    </div>
</template>
