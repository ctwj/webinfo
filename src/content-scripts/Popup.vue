<template>
    <el-drawer
        v-model="visible"
        title="webinfo"
        direction="rtl"
        :size="size"
    >
        <popup-panel />
    </el-drawer>
</template>

<script lang="ts">

import { defineComponent } from "vue";

import PopupPanel from "@/content-scripts/PopupPanel.vue";

export default defineComponent({
    components: {
        PopupPanel
    },
    data: () => ({ 
        visible: false,
        size: '960'
    }),
});
</script>

<style scoped>
</style>
