<script setup lang="ts">
import { startRegistration } from '@simplewebauthn/browser';
import { RegistrationResponseJSON } from '@simplewebauthn/server/script/deps';
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue';
import { LEVEL, info_t } from './log';
import { Err, h } from './utils';

const name = useLocalStorage('name', "");
const baggage = ref("{ \"token\": \"asymmetry\" }");
const emit = defineEmits<{
    (event: 'msg', msg: info_t): void
}>();


let url_prefix = "";
if (process.env.VERCEL) {
    url_prefix = "/api/bran/?";
}

async function register() {
    let url = `${url_prefix}name=${name.value}`;
    emit("msg", { level: LEVEL.INFO, msg: "fetch challenge", timeout: -1 });
    const resp = await h(fetch(url));
    if (resp.err || !resp.v?.ok) {
        emit("msg", { level: LEVEL.ERROR, msg: "fetch challenge failed", timeout: 3000 });
        return;
    }
    const respJson = await h(resp.v.json());
    if (respJson.err) {
        emit("msg", { level: LEVEL.ERROR, msg: "fetch challenge failed", timeout: 3000 });
        return;
    }
    emit("msg", { level: LEVEL.WARNING, msg: "confirm?", timeout: respJson.v?.timeout ?? -1 });
    let attResp: Err<RegistrationResponseJSON & { baggage?: object }> = await h(startRegistration(respJson.v));
    if (attResp.err) {
        emit("msg", { level: LEVEL.ERROR, msg: `register failed: ${attResp.err.message}`, timeout: 3000 });
        return;
    }
    emit("msg", { level: LEVEL.INFO, msg: "wait for verify", timeout: -1 });
    attResp.v!.baggage = JSON.parse(baggage.value);
    let verificationResp = await h(fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(attResp.v),
    }));
    if (verificationResp.err || !verificationResp.v?.ok) {
        emit("msg", { level: LEVEL.ERROR, msg: `register failed`, timeout: 3000 });
        return;
    }
    emit("msg", { level: LEVEL.SUCCESS, msg: `register succeed`, timeout: -1 });
}
</script>

<template>
    <div class="grid grid-cols-1 my-2 gap-1">
        <input class="input input-bordered input-info input-lg" placeholder="name" v-model="name" />
        <textarea class="textarea textarea-bordered" placeholder="baggage" v-model="baggage"></textarea>
        <button class="btn btn-warning btn-sm" @click="register"></button>
    </div>
</template>
