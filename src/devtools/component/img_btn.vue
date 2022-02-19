<template>
    <div class="icon-wrapper"
        @click="event => click"
        @mouseover="mouseEnter"
        @mouseleave="mouseLeave">
        <img v-if="type === 'circle'" class="icon" src="@/devtools/img/circle.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
        <img v-if="type === 'remove'" class="icon" src="@/devtools/img/slash.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
        <img v-if="type === 'arrowDown'" class="icon" src="@/devtools/img/arrow-left.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
        <img v-if="type === 'arrowRight'" class="icon" src="@/devtools/img/arrow-right.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
        <img v-if="type === 'arrowDownFill'" class="icon" src="@/devtools/img/arrow-down.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
        <img v-if="type === 'arrowUpFill'" class="icon" src="@/devtools/img/arrow-up.svg" :style="`filter: drop-shadow(${imgColor} 80px 0);`"/>
    </div>
    
</template>

<script lang="ts">

/**
 * 图标
 */

import { defineComponent, reactive, onMounted, ref } from "vue";

type ClickFun = (payload: MouseEvent) => void;

export default defineComponent({
    name: "Toolbar",
    props: {
        type: String,
        click: Function,
        disabled: {
            type: Boolean,
            default: false,
        },
        color: {
            type: String,
            default: '#6E6E6E'
        },
        hoverColor: {
            type: String,
            default: '#202124'
        }
    },
    setup: (props) => {
        let imgColor = ref(props.color);

        onMounted(() => {
            // imgColor.value = props.color;
        })

        const mouseEnter = () => {
            imgColor.value = props.hoverColor;
        }

        const mouseLeave = () => {
            imgColor.value = props.color;
        }

        return {
            imgColor, mouseEnter, mouseLeave
        }
    }
    
})
</script>