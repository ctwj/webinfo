<template>
    <ImgBtn type="circle" :color="color" :hoverColor="hoverColor" @click="e => click" />
</template>

<script lang="ts">

/**
 * switch
 */

import { defineComponent, computed, onMounted, ref } from "vue";

import ImgBtn from './img_btn.vue';

export default defineComponent({
    name: "Switch",
    components: {
        ImgBtn
    },
    props: {
        switch: {
            type: Boolean,
            default: false,
        },
        click: Function
    },
    setup: (props) => {
        const color = computed(() => {
            return props.switch ? '#D93025' : '#6E6E6E';
        });
        const hoverColor = computed(() => {
            return props.switch ? '#D93025' : '#202124'
        });

        onMounted(() => {
            // imgColor.value = props.color;
        })

        return {
            color, hoverColor
        }
    }
    
})
</script>