<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser';
import { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue';

const name = useLocalStorage('name', "");
const baggage = ref("{ \"token\": \"asymmetry\" }");

let url_prefix = "";
if (process.env.VERCEL) {
    url_prefix = "/api/bran/?";
}

async function register() {
    let url = `${url_prefix}name=${name.value}`;
    let resp = await fetch(url);
    let attResp: RegistrationResponseJSON & { baggage?: object } = await startRegistration(await resp.json());
    attResp.baggage = JSON.parse(baggage.value);
    let verificationResp = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(attResp),
    });
    if (verificationResp.ok) {
        console.log("ok")
    }
}
</script>

<template>
    <div class="grid grid-cols-1 my-2 gap-1">
        <input class="input input-bordered input-info input-lg" placeholder="name" v-model="name" />
        <textarea class="textarea textarea-bordered" placeholder="baggage" v-model="baggage"></textarea>
        <button class="btn btn-outline btn-warning btn-sm" @click="register"></button>
    </div>
</template>
