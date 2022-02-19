<template>
    <div id="toolbar" class="title-bg-color border">
        <Switch :switch="switchOn" @click="() => switchClick" />
        <ImageBtn type="remove" @click="()=>removeClick"/>
    </div>
</template>

<script lang="ts">

/**
 * 顶部工具栏
 */

import { defineComponent, reactive, watch, onMounted, ref } from "vue";

import ImageBtn from './img_btn.vue';
import Switch from './switch.vue';

export default defineComponent({
    name: "Toolbar",
    components: {
        ImageBtn, Switch, 
    },
    props: {
        switchOnValue: Boolean,
        switchClick: Function,
        removeClick: Function
    },
    setup: (props) => {
        const switchOn = ref(false);
        const doSwitch = () => {
            switchOn.value = !switchOn.value;
        }
        watch(() => props.switchOnValue, (val, oldVal) => {
            switchOn.value = val;
        });
        onMounted(() => {
            switchOn.value = props.switchOnValue;
        });
        return {
            switchOn, doSwitch
        }
    }
    
})
</script>