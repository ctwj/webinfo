<template>
    <div class="request-list-wrapper border">
        <header class="request-head header" @click="show.rule = !show.rule">
            Rules
            <ImgBtn :type="show.rule ? 'arrowDown' : 'arrowRight'" />
        </header>
        <div v-if="show.rule" class="rules-list container">
            <Empty v-if="show.ruleList.length == 0"/>
        </div>
        <header class="request-head header" @click="show.request = !show.request">
            Request
            <ImgBtn :type="show.request ? 'arrowDown' : 'arrowRight'" />
        </header>
        <div v-if="show.request" class="request-list container">
            <Empty v-if="show.requestList.length == 0"/>
        </div>
        <!-- <footer class="request-footer footer">
            Total: 10 Request
        </footer> -->
    </div>
</template>

<script lang="ts">

/**
 * 请求列表
 */

import { defineComponent, reactive, onMounted, ref } from "vue";

import ImgBtn from './img_btn.vue';
import Empty from './empty.vue';

export default defineComponent({
    name: "RequestList",
    components: {
        ImgBtn, Empty,
    },
    setup: () => {
        const show = reactive({
            rule: true,
            request: true,
            ruleList: [],
            requestList: [],
        })

        return {
            show
        }
    }
    
})
</script>