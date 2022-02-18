<template>
    <div id="devtools-container">
        <Toolbar />
        <div id="tool-panel">
            <RequestList />
            <RuleList />
            <RequestDetail />
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

import Toolbar from './component/toolbar.vue';
import RequestList from './component/request_list.vue';
import RuleList from './component/rule_list.vue';
import RequestDetail from './component/request_detail.vue';

export default defineComponent({
    name: "App",
    components: {
        Toolbar, RequestList, RuleList, RequestDetail,
    },
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