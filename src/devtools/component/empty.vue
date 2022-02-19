<template>
    <div class="empty-wrapper center">
        <div class="center flex-column">
            <img class="empty-icon" src="@/devtools/img/empty.svg"/>
            <span style="color: #bfbfbf;">{{ text }}</span>
        </div>
    </div>
    
</template>

<script lang="ts">

/**
 * Empty
 */

import { defineComponent, reactive, onMounted, ref } from "vue";

type ClickFun = (payload: MouseEvent) => void;

export default defineComponent({
    name: "Empty",
    props: {
        text: {
            type: String,
            default: '还没有数据'
        }
    },
})
</script>