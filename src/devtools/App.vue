<template>
    <div id="devtools-container">
        <Toolbar
            :switchOnValue="enable"
            @switchClick="switchClick"
            @removeClick="removeClick"
        />
        <div id="tool-panel">
            <RequestList :rules="data.rules" :requestList="data.requestList" />
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

import Toolbar from "./component/toolbar.vue";
import RequestList from "./component/request_list.vue";
import RequestDetail from "./component/request_detail.vue";

interface RequestData {
    api?: string; // 显示的接口地址
    url: string; // 实际请求地址
    method: string; // 请求方式
    key: string; // 根据url和参数生成的唯一key
    data: BaseRequestData;
}

export default defineComponent({
    name: "App",
    components: {
        Toolbar,
        RequestList,
        RequestDetail,
    },
    setup: () => {
        const isDev = !!chrome.devtools;
        const logger = (info: string, type: string = "log") => {
            let str = `[devtools] ${info}`;
            isDev &&
                chrome.devtools.inspectedWindow.eval(
                    `console.log(unescape("${escape(str)}"))`
                );
        };

        const modify = new ResponseModifyComponent();
        const enable = ref(false);
        const data = reactive<{ rules: any[]; requestList: RequestData[] }>({
            rules: [] as any[],
            requestList: [] as RequestData[],
        });
        const selection = reactive({
            requestId: "", // 选中的请求id
            requestData: null, // 选中的请求数据
            ruleId: "",
            rule: null, // 当前选中规则
        });

        // 连接到 background ， 不能直接和 content-script 通信, 通过 background 中专
        const backgroundPageConnection = chrome.runtime.connect({
            name: "devtools-page",
        });

        // 从 BaseRequestData 中获取实际请求地址
        const getUrl = (data: BaseRequestData): string => {
            const url = data.url.match(/(https?:\/\/.*?)\/.*?/g) + data.path;
            return UrlInfo.get_url_without_params(url);
        };
        const messageCallback = (message: any) => {
            // 检测消息来源
            logger("message from background");
            logger(JSON.stringify(message));

            if (!message.command || message.command !== "notice") {
                return;
            }

            // request.data 为请求数据
            try {
                const url = getUrl(message.data);
                const api = message.url;
                const key = new UrlInfo(url).get_url_hash();
                const method = message.data.method;

                if (
                    !data.requestList.find(
                        (item) => item.key === key && item.method === method
                    )
                ) {
                    data.requestList.push({
                        url,
                        key,
                        method,
                        api,
                        data: message.data,
                    });
                }

                logger(JSON.stringify(data.requestList));
                logger(data.requestList.length.toString());
            } catch (e) {
                logger("devtools");
                logger(JSON.stringify(e));
            }
        };

        onMounted(async () => {
            logger("onMounted in devtools");
            enable.value = await modify.isEnable();

            backgroundPageConnection.postMessage({
                name: "devtools-init",
                tabId: chrome.devtools?.inspectedWindow?.tabId ?? null,
            });

            // 开始接口 content-script 发送过来的notice
            backgroundPageConnection.onMessage.addListener(messageCallback);

            // TODO Debug DATA
            data.requestList = [
                {
                    url: "https://www.baidu.com//s?_cr1=&_ss=&bs=&clist=&csor=&f4s=&hsug=&ie=&isbd=&isid=&mod=&oq=&pn=&rsv_idx=&rsv_pq=&rsv_sid=&rsv_t=&tn=&usm=&wd=",
                    key: "90b679a3024093e969e49706ea8952bc",
                    method: "GET",
                    data: {
                        headers: [
                            ["Accept", "*/*"],
                            [
                                "is_referer",
                                "https://www.baidu.com/s?ie=utf-8&f=8&rsv_bp=1&rsv_idx=2&tn=baiduhome_pg&wd=1&rsv_spt=1&oq=1&rsv_pq=bf5e9d4c0004f96f&rsv_t=d41esikJwATAIu4BNuHDsFLejfc0RDxzFmhxK4vuh16GzqMSTYj1jEskZD7lnp8t3yU7&rqlang=cn",
                            ],
                            ["is_xhr", "1"],
                            ["X-Requested-With", "XMLHttpRequest"],
                        ],
                        data: [],
                        method: "GET",
                        path: "/s?ie=utf-8&mod=1&isbd=1&isid=0C59E3A2F8674377&wd=1&pn=10&oq=1&tn=baiduhome_pg&ie=utf-8&usm=5&rsv_idx=2&rsv_pq=bf5e9d4c0004f96f&rsv_t=c1a0FG%2B86TE7rhqUEe7g5OYBi38I5YB0Od9uq%2F2ZLIh%2Bce5HyYRH9Yt4Q92ypBX1gCht&bs=1&rsv_sid=undefined&_ss=1&clist=&hsug=&f4s=1&csor=0&_cr1=21361",
                        url: "https://www.baidu.com/s?wd=1&pn=10&oq=1&tn=baiduhome_pg&ie=utf-8&usm=5&rsv_idx=2&rsv_pq=bf5e9d4c0004f96f&rsv_t=c1a0FG%2B86TE7rhqUEe7g5OYBi38I5YB0Od9uq%2F2ZLIh%2Bce5HyYRH9Yt4Q92ypBX1gCht",
                    },
                },
                {
                    url: "https://www.baidu.com/https://ug.baidu.com/mcp/pc/pcsearch",
                    key: "2104a0a5903ef71ea1b41c3ef0816702",
                    method: "POST",
                    data: {
                        headers: [["Content-Type", "application/json"]],
                        data: [
                            '{"invoke_info":{"pos_1":[{}],"pos_2":[{}],"pos_3":[{}]}}',
                        ],
                        method: "POST",
                        path: "https://ug.baidu.com/mcp/pc/pcsearch",
                        url: "https://www.baidu.com/s?wd=1&pn=10&oq=1&tn=baiduhome_pg&ie=utf-8&usm=5&rsv_idx=2&rsv_pq=bf5e9d4c0004f96f&rsv_t=c1a0FG%2B86TE7rhqUEe7g5OYBi38I5YB0Od9uq%2F2ZLIh%2Bce5HyYRH9Yt4Q92ypBX1gCht",
                    },
                },
                {
                    url: "https://www.baidu.com//s?_ck=&bs=&chk=&cqid=&csq=&f4s=&ie=&isbd=&isid=&isnop=&istc=&mod=&oq=&pn=&pstg=&rsv_idx=&rsv_pq=&rsv_stat=&rsv_t=&tn=&usm=&ver=&wd=",
                    key: "39426a0b67728a9d307bcfd03df40fb6",
                    method: "GET",
                    data: {
                        headers: [
                            ["Accept", "*/*"],
                            [
                                "is_referer",
                                "https://www.baidu.com/s?wd=1&rsv_spt=1&rsv_iqid=0xc2e9082500092316&issp=1&f=8&rsv_bp=1&rsv_idx=2&ie=utf-8&tn=baiduhome_pg&rsv_enter=0&rsv_dl=tb&rsv_sug3=2&rsv_sug1=2&rsv_sug7=101&rsv_btype=i&prefixsug=1&rsp=9&inputT=191279&rsv_sug4=191278",
                            ],
                            ["is_xhr", "1"],
                            ["X-Requested-With", "XMLHttpRequest"],
                        ],
                        data: [],
                        method: "GET",
                        path: "/s?ie=utf-8&csq=1&pstg=20&mod=2&isbd=1&cqid=fe3e79210009b466&istc=754&ver=QwxwSQQ_OOLaje7i5_0Wyu9Z10N9XSeMCYW&chk=621792f2&isid=0C59E3A2F8674377&wd=1&pn=10&oq=1&tn=baiduhome_pg&ie=utf-8&usm=5&rsv_idx=2&rsv_pq=bf5e9d4c0004f96f&rsv_t=c1a0FG%2B86TE7rhqUEe7g5OYBi38I5YB0Od9uq%2F2ZLIh%2Bce5HyYRH9Yt4Q92ypBX1gCht&bs=1&f4s=1&_ck=1299.0.96.24.17.28125.222.2313&isnop=1&rsv_stat=-2",
                        url: "https://www.baidu.com/s?wd=1&pn=10&oq=1&tn=baiduhome_pg&ie=utf-8&usm=5&rsv_idx=2&rsv_pq=bf5e9d4c0004f96f&rsv_t=c1a0FG%2B86TE7rhqUEe7g5OYBi38I5YB0Od9uq%2F2ZLIh%2Bce5HyYRH9Yt4Q92ypBX1gCht",
                    },
                },
            ];
            window.console.log(data.requestList);
        });

        onUnmounted(() => {
            chrome.runtime.onMessage.removeListener(messageCallback);
        });

        // 开关
        const switchClick = () => {
            enable.value = !enable.value;
        };

        // 清除request
        const removeClick = () => {
            logger("removeClick in devtools");
        };

        return {
            enable,
            data,
            selection,
            removeClick,
            switchClick,
        };
    },
});
</script>