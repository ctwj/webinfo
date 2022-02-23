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

import { json } from "stream/consumers";
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
        const logger = (info: string, type: string = 'log') => {
            let str = `[devtools] ${info}`;
            chrome.devtools.inspectedWindow.eval(
                `console.log(unescape("${escape(str)}"))`);
        }

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

        // 连接到 background ， 不能直接和 content-script 通信, 通过 background 中专
        const backgroundPageConnection = chrome.runtime.connect({
            name: "devtools-page"
        });


        // 从 BaseRequestData 中获取实际请求地址
        const getUrl = (data:BaseRequestData):string => {
            const url = data.url.match(/(https?:\/\/.*?)\/.*?/g) + data.path;
            return UrlInfo.get_url_without_params(url);
        }
        const messageCallback = (message:any) => {
                // 检测消息来源
                logger('message from background');
                logger(JSON.stringify(message));

                if (!message.command || message.command !== 'notice') {
                    return;
                } 

                // request.data 为请求数据
                try {
                    const url = getUrl(message.data);
                    const api = message.url;
                    const key = (new UrlInfo(url)).get_url_hash();
                    const method = message.data.method;

                    if (!data.requests.find(item => item.key === key && item.method === method)) {
                        data.requests.push({
                            url, key, method, api,
                            data: message.data
                        })
                    }

                    logger(JSON.stringify(data.requests));
                    logger(data.requests.length.toString());

                } catch (e) {
                    logger('devtools');
                    logger(JSON.stringify(e));
                }
        };


        onMounted(async () => {
            logger('onMounted in devtools');
            enable.value = await modify.isEnable();

            backgroundPageConnection.postMessage({
                name: 'devtools-init',
                tabId: chrome.devtools.inspectedWindow.tabId
            });
            
            // 开始接口 content-script 发送过来的notice
             backgroundPageConnection.onMessage.addListener(
                 messageCallback
             );
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
            logger('removeClick in devtools');
        }

        return {
            enable,
            data, selection,
            removeClick, switchClick
        }
    }
    
})
</script>