<template>
    <div id="toolbar" class="title-bg-color">
        <Switch :switch="switchOn" @click="doSwitch" />
        <ImageBtn type="remove" @click="()=>{}"/>
    </div>
</template>

<script lang="ts">

/**
 * 顶部工具栏
 */

import { defineComponent, reactive, onMounted, ref } from "vue";

import ImageBtn from './img_btn.vue';
import Switch from './switch.vue';

export default defineComponent({
    name: "Toolbar",
    components: {
        ImageBtn, Switch, 
    },
    setup: () => {
        const switchOn = ref(false);
        const doSwitch = () => {
            switchOn.value = !switchOn.value;
        }
        return {
            switchOn, doSwitch
        }
    }
    
})
</script>