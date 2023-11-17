<script setup lang="ts">
import { ref } from 'vue';
import { startAuthentication } from '@simplewebauthn/browser';
import { useLocalStorage } from '@vueuse/core'
import { useUrlSearchParams } from '@vueuse/core';
import { info_t, LEVEL } from './log';
import { h } from './utils';

const searchParams = useUrlSearchParams('hash');
const name = useLocalStorage('name', "");
const token = ref("");
const emit = defineEmits<{
    (event: 'msg', msg: info_t): void
}>();

let url_prefix = "";
if (process.env.VERCEL) {
    url_prefix = "/api/hodor/?";
}

async function auth() {
    let url = `${url_prefix}name=${name.value}`;
    emit("msg", { level: LEVEL.INFO, msg: 'fetch challenge', timeout: -1 });
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
    emit("msg", { level: LEVEL.WARNING, msg: 'confirm?', timeout: respJson.v?.timeout ?? -1 });
    const asseResp = await h(startAuthentication(respJson.v));
    if (asseResp.err) {
        emit("msg", { level: LEVEL.ERROR, msg: `authenticate failed: ${asseResp.err.message}`, timeout: 3000 });
        return;
    }
    emit("msg", { level: LEVEL.INFO, msg: 'wait for verify', timeout: -1 });
    const verificationResp = await h(fetch(url, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(asseResp.v),
    }));
    if (verificationResp.err || !verificationResp.v?.ok)
    {
        emit("msg", { level: LEVEL.ERROR, msg: `verification failed: ${verificationResp.err?.message}`, timeout: 3000 });
        return;
    }
    const result = await h(verificationResp.v.json());
    if (result.err)
    {
        emit("msg", { level: LEVEL.ERROR, msg: `verification failed: ${result.err.message}`, timeout: 3000 });
        return;
    }
    token.value = result.v.baggage?.token ?? "";
    emit("msg", { level: LEVEL.SUCCESS, msg: `get token`, timeout: 5000 });

    if (searchParams.callback?.length > 0) {
        let url = new URL(decodeURIComponent(searchParams.callback as string));
        url.searchParams.set('token', token.value);
        console.log(url);
        window.location.replace(url.href);
    }
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
