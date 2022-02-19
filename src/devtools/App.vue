<template>
    <div id="devtools-container">
        <Toolbar 
            :switchOnValue="enable"
            @switchClick="switchClick"
            @removeClick="removeClick" />
        <div id="tool-panel">
            <RequestList
                :rules="data.rules"
                :requests="data.requests" />
            <RequestDetail />
        </div>
    </div>
</template>

<script lang="ts">

/**
 * 配置页面
 */

import { defineComponent, reactive, onMounted, onUnmounted, ref } from "vue";
import { ConfigItem, ConfigType } from "@/components/type";
import { removeListener } from "process";
import { ResponseModifyComponent } from "@/components/response_modify/response_modify";
import { BaseRequestData } from "@/components/response_modify/type";
import { UrlInfo } from "@/utils/url";

import Toolbar from './component/toolbar.vue';
import RequestList from './component/request_list.vue';
import RequestDetail from './component/request_detail.vue';

interface RequestData {
    api: string,            // 显示的接口地址
    url: string,            // 实际请求地址
    method: string,         // 请求方式
    key: string,            // 根据url和参数生成的唯一key
    data: BaseRequestData;
}

export default defineComponent({
    name: "App",
    components: {
        Toolbar, RequestList, RequestDetail,
    },
    setup: () => {
        const modify = new ResponseModifyComponent();
        const enable = ref(false);
        const data = reactive({
            rules: [],
            requests: [] as RequestData[],
        });
        const selection = reactive({
            requestId:'',       // 选中的请求id
            requestData: null,    // 选中的请求数据
            ruleId: '',
            rule: null,           // 当前选中规则
        })

        // 从 BaseRequestData 中获取实际请求地址
        const getUrl = (data:BaseRequestData):string => {
            return '';
        }
        const messageCallback = (request:any, sender:any, sendResponse:any) => {
                // 检测消息来源
                window.console.log('request',request);
                sendResponse({ result: true})

                if (!request.command || request.command === 'notice') {
                    return;
                } 

                // request.data 为请求数据
                try {
                    const url = getUrl(request.data);
                    const api = request.url;
                    const key = (new UrlInfo(url)).get_url_hash();
                    const method = request.data.method;

                    if (!data.requests.find(item => item.key === key && item.method === method)) {
                        data.requests.push({
                            url, key, method, api,
                            data: request.data
                        })
                    }

                    window.console.log(data.requests);

                } catch (e) {
                    //
                    window.console.log(e);
                }
        };


        onMounted(async () => {
            console.log('onMounted');
            enable.value = await modify.isEnable();
            
            // 开始接口 content-script 发送过来的notice
            chrome.runtime.onMessage.addListener(messageCallback);
        });

        onUnmounted( () => {
            chrome.runtime.onMessage.removeListener(messageCallback);
        })

        // 开关
        const switchClick = () => {
            enable.value = !enable.value;
            
        }

        // 清除request
        const removeClick = () => {
            window.console.log('remove');
        }

        return {
            enable,
            data, selection,
            removeClick, switchClick
        }
    }
    
})
</script>