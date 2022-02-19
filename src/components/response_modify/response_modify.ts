import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";

import { ReplaceRules, HookerConfig } from './type';


interface BaseRequestData {
    data: string[];
    headers: [];
    method: string;
    path: string;
    url: string;
}

/**
 * 通知的数据结构
 */
interface NoticeData {
    type: string;
    data: BaseRequestData;
    from: string;
    to: string;
}

/**
 * response-modify
 * 接口返回值修改， 
 * 1. 记录api
 * 2. 点击api，修改返回值， 保存成返回实例， 可以保存多个，进行切换
 */
export class ResponseModifyComponent extends BaseComponent {

    // component public
    public name = "response-modify";
    public desc = "接口返回值修改器， 修改 api 返回值";


    /**
     * 配置项
     */
    public config = new ComponnetConfig(
        this.name,
        [
            {
                name: "rules",
                title: "response modify rules",
                visable: false,
                description: "配置的替换规则",
                default: [],
                value: [],
            },
        ]
    );


    /**
     * 
     */
    constructor() {
        super();
    }

    // ============================== background =======================

    /**
     * background
     */
    public background(): void {
    }

    // ============================== content script =======================


    private injectController(enable: boolean, rules: ReplaceRules[]) {
        // 写入 重写规则
        window.postMessage({ type: 'setRules', from: 'content-script', to: 'inject', data: rules });

        // 开启 代理
        if (enable) {
            // window.postMessage({ type: 'disableProxy', from: 'content-script', to: 'inject', data: null });
            window.postMessage({ type: 'enableProxy', from: 'content-script', to: 'inject', data: null });
        }
    }



    /**
     * 注入在 content-script 中代码
     */
    public async content() {
        const enable = await this.isEnable();
        const config:HookerConfig = { isHooked: enable };
        const rules:ReplaceRules[] = await this.getConfig().get('rules');
        
        // 注入一个 inject.js 用户代理 xhr，修改response
        var file = chrome.runtime.getURL('inject.js')
        var s = document.createElement('script')
        s.type = 'text/javascript'
        s.src = file
        document.documentElement.appendChild(s)

        // 监听 inject.js 的数据
        window.addEventListener('message', (msg) => {
            const message: NoticeData = msg.data;
            if (message.from !== 'inject' || message.to !== 'content-script') {
                return;
            }
            switch (message.type) {
                case 'injectReady':
                    this.injectController(enable, rules);
                    // window.console.log(message);
                    break;
                case 'notice':
                    window.console.log(message);
                    break;
            }
        });

        window.addEventListener('ResponseModifyMessage', evt => {
            window.console.log(evt);
        })

    }

    // ============================== background =======================

    /**
     * devtools 中执行
     */
    public static devtools() {

        // 创建pannel
        chrome.devtools.panels.create("ResponseModify",
            "MyPanelIcon.png",
            "devtools/index.html",
            function (panel) {
                // code invoked on panel creation
            }
        );

        const logger = (info: string, type: string = 'log') => {
            chrome.devtools.inspectedWindow.eval(
                `console.log(unescape("${escape(info)}"))`);
        }

        // chrome.devtools.network.onRequestFinished.addListener(
        //     function (request) {
        //         logger(request.request.url)
        //     }
        // );
    }


}