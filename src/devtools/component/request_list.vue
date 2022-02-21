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
            <div v-else v-for="request in reqeustList" :key="request.key"
                class="request-item">
                <span :title="request.url">{{ request.api }}</span>
            </div>
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
import { BaseRequestData } from "@/components/response_modify/type";

import ImgBtn from './img_btn.vue';
import Empty from './empty.vue';

interface RequestData {
    api: string,            // 显示的接口地址
    url: string,            // 实际请求地址
    method: string,         // 请求方式
    key: string,            // 根据url和参数生成的唯一key
    data: BaseRequestData;
}

const DEFAULT_DATA = {
    rules: [],
    requests:[] as RequestData[]
}

export default defineComponent({
    name: "RequestList",
    components: {
        ImgBtn, Empty,
    },
    props: {
        rules: Array,
        requests: Array
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