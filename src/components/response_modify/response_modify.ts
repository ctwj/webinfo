import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";
import { Command } from "./type";

import { ReplaceRules, HookerConfig, MSG, BaseRequestData } from './type';

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

    // ============================== content script =======================


    private injectController(enable: boolean, rules: ReplaceRules[]) {
        // 写入 重写规则
        let event = new CustomEvent('ResponseModifyMessage', { detail: { type: 'setRules', from: 'content-script', to: 'inject', data: rules } });
        window.dispatchEvent(event);

        // 开启 代理
        if (enable) {
            // window.postMessage({ type: 'disableProxy', from: 'content-script', to: 'inject', data: null });
            let event = new CustomEvent('ResponseModifyMessage', { detail: { type: 'enableProxy', from: 'content-script', to: 'inject', data: null }});
            window.dispatchEvent(event);
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
        window.addEventListener('ResponseModifyMessage', (msg) => {
            // @ts-ignore
            // window.console.log(msg.detail);

            

            // @ts-ignore
            const message: NoticeData = msg.detail;
            if (message.from !== 'inject' || message.to !== 'content-script') {
                return;
            }
            switch (message.type) {
                case 'injectReady':
                    this.injectController(enable, rules);
                    // window.console.log(message);
                    break;
                case 'notice':
                    
                    this.logger('get notice message from inject.js', 'content-script');
                    console.log(message);

                    // 发送到 background 
                    this.logger('try send it to background', 'content-script');
                    chrome.runtime.sendMessage(
                        {
                            command: MSG.NOTICE,
                            data: message.data
                        },
                        (res) => {
                            this.logger('get background callback reuslt:', 'content-script');
                            console.log(res);
                        }
                    );
                    break;
            }
        });

    }

    // ============================== background =======================

    /**
     * background
     * 1. 监听 content-scirpt 过来的请求，【notice】，并转发到 background
     * 2. 监听 background 过来的请求
     */
    public background(): void {
        var connections = {};
        let that = this;

        chrome.runtime.onConnect.addListener( (port) => {
            
            let extensionListener = (message: any) => {
                this.logger(`get message from port ${JSON.stringify(message)}`);

                // The original connection event doesn't include the tab ID of the
                // DevTools page, so we need to send it explicitly.
                if (message.name == "devtools-init") {
                    if (!message.tabId) {
                        that.logger('get a null tabId');
                        return;
                    }
                    // @ts-ignore
                    connections[message.tabId] = port;
                    return;
                }

                // other message handling
            }

            // @ts-ignore Listen to messages sent from the DevTools page
            port.onMessage.addListener(extensionListener);

            port.onDisconnect.addListener(function (port) {
                // @ts-ignore
                port.onMessage.removeListener(extensionListener);

                var tabs = Object.keys(connections);
                for (var i = 0, len = tabs.length; i < len; i++) {
                    // @ts-ignore
                    if (connections[tabs[i]] == port) {
                        // @ts-ignore
                        delete connections[tabs[i]]
                        break;
                    }
                }
            });
        });

        // Receive message from content script and relay to the devTools page for the
        // current tab
        // 监听 打开options页面
        chrome.runtime.onMessage.addListener((message: Command, sender, sendResponse) => {
            // Messages from content scripts should have sender.tab set

            
            this.logger('get message from content-script');
            console.log(message);
            if (sender.tab) {
                var tabId = sender.tab.id;
                // @ts-ignore
                if (tabId in connections) {
                    // @ts-ignore
                    connections[tabId].postMessage(message);
                } else {
                    this.logger('Tab not found in connection list.');
                }
            } else {
                this.logger('sender.tab not defined.');
            }
            return true;
        });
    }

    // ============================== devtools =======================

    /**
     * devtools 
     * 1. 创建 dev panel
     * 2. 监听， background 过来的 api 请求， 并显示在列表中
     * 3. 通知 background 页面， devtools 页面已经打开
     */
    public static devtools() {

        this.logger('crate panel', 'devtools')
        // 创建pannel
        chrome.devtools.panels.create("ResponseModify",
            "MyPanelIcon.png",
            "devtools/index.html",
            function (panel) {
                // code invoked on panel creation
            }
        );
    }


}