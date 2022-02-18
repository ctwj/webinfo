<template>
    <div id="devtools-container">
        <div id="toolbar"></div>
        <div id="tool-panel">
            <div class="request-list">
                <div class="request-head"></div>
                <div class="request-list"></div>
                <div class="rules-list"></div>
                <div class="request-footer"></div>
            </div>
            <div class="rule-list">
                <div class="rule-head"></div>
                <div class="rules-list"></div>
                <div class="rule-footer"></div>
            </div>
            <div class="request-detail"></div>
        </div>
    </div>
</template>

<script lang="ts">

/**
 * 配置页面
 */

import { defineComponent, reactive, onMounted, ref } from "vue";

import { ConfigItem, ConfigType } from "@/components/type";
import { ResponseModifyComponent } from "@/components/response_modify/response_modify";


export default defineComponent({
    name: "App",
    setup: () => {
        const modify = new ResponseModifyComponent();
        const enable = ref(false);
        const selection = reactive({
            requestId:'',       // 选中的请求id
            requestData: null,    // 选中的请求数据
            rules:[],           // 选中的请求的规则
            rule: null,           // 当前选中规则
        })


        onMounted(async () => {
            console.log('onMounted');
            enable.value = await modify.isEnable();
        });



        return {
            enable
        }
    }
    
})
</script>