<template>
    <div class="request-list-wrapper border">
        <header class="request-head header border" @click="show.rule = !show.rule">
            Rules
            <ImgBtn :type="show.rule ? 'arrowDown' : 'arrowRight'" />
        </header>
        <div v-if="show.rule" class="rules-list container border">
            <Empty v-if="show.ruleList.length == 0"/>
        </div>
        <header class="request-head header border" @click="show.request = !show.request">
            Request
            <ImgBtn :type="show.request ? 'arrowDown' : 'arrowRight'" />
        </header>
        <div v-if="show.request" class="request-list container border">
            <Empty v-if="requestList.length === 0"/>
            <div v-else 
                v-for="(request,index) in requestList" 
                :key="request.key"
                :class="[`${index % 2 ? 'odd' : 'even'}`]"
                class="request-item">
                <span style="display:inline-block;overflow:hidden;text-overflow:ellipsis;" :title="request.url">{{ request.url }}</span>
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

import { defineComponent, reactive, onMounted, ref, watch } from "vue";
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

export default defineComponent({
    name: "RequestList",
    components: {
        ImgBtn, Empty,
    },
    props: {
        rules: {
            type: Array
        },
        requestList: {
            type: Array,
            default: () => ([])
        },
    },
    setup: (props) => {
        watch([()=>props.requestList], (val) => {
            window.console.log(val);
        } )
        const show = reactive<{
            rule: boolean, request: boolean, ruleList: any[]
        }>({
            rule: true,
            request: true,
            ruleList: [],
        });

        return {
            show
        }
    }
    
})
</script>