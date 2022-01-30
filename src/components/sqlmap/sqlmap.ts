import { BaseComponent } from "@/components/component";

import Task from "@/utils/task";
import SqlmapSDK from "./sqlmap_sdk";

import { Command, CommandReply, MSG } from './const';


interface SearchResultMessage {
    type: 'sqlmap-search-urls';
    data: string[];
}

interface Target {
    url: string;
}

export class SqlmapComponent extends BaseComponent {

    public name = "sqlmap";
    public desc = "获取google的搜索结果， 发送到sqlmapapi接口中";
    public task = new Task<Target>(this.taskHandler, this);
    public sdk = new SqlmapSDK();

    /**
     * 
     */
    constructor () {
        super();
    }

    /**
     * 
     */
    public init () {

    }

    /**
     * 注入在 content-script 中代码
     * 获取sqlmap的搜索结果发送到sqlmapapi接口中
     */
    public async content () {

        // 组件是否启动
        if (!await this.isEnable()) {
            return;
        }

        // Google 页面，存在搜索条件
        const {host, search} = window.location;
        if ( host.includes('www.google.com') && 
            /q=[^&]{1,}&/i.test(search)
        ) {
            const list = document.querySelector('#search')?.querySelectorAll('a[ping][target=_blank]') ?? [];
            if (!list.length) {
                return;
            }
            const urls = new Set();
            list.forEach(item => {
                if (!item.className.includes('fl')) {
                    const url = new URL(item.getAttribute('href') ?? '');
                    if (url.search !== '') {
                        urls.add(item.getAttribute('href'));
                    }
                }
            });
            
            // url 中获取到的是，搜索结果链接地址
            chrome.runtime.sendMessage({ type: 'sqlmap-search-urls', data: [...urls]}, (response) => {
                console.log('received user data', response);
            });
        } 
    }

    /**
     * 过滤域名，在黑名单中的url，不进行扫描
     * @param url 
     * @returns 
     */
    private inBlackList (url: string):boolean {
        // 过滤 黑名单， 黑名单内的域名， 不进行扫描
        const blacklist = [
            'www.google.com',
            'play.google.com',
            'www.youtube.com',
            'www.baidu.com',
            'www.bing.com',
            'www.twitter.com',
            'www.webo.com',
        ];
        const uri = new URL(url);
        return blacklist.includes(uri.hostname);
    }

    /**
     * 后台运行
     */
    public background() {

        // 监听 事件  
        chrome.runtime.onMessage.addListener((message: SearchResultMessage, sender, sendResponse) => {
            if (message.type === 'sqlmap-search-urls') {
                message.data.filter(url => !this.inBlackList(url)).forEach(url => {
                    console.log(`[i] add task url ${url}`);
                    this.task.add({ url });
                })
                sendResponse('ok');
            }
        });

        // 监听 connect 命令
        chrome.runtime.onConnect.addListener( port => {
            port.onMessage.addListener( msg => {
                let cmdMsg: Command = msg;

                console.log('message from page', msg);

                // 获取任务列表
                if (cmdMsg.command === MSG.TASK_LIST) {
                    
                    this.sdk.getAllTaskList().then(res => {
                        const replyMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: true, data: res }
                        port.postMessage(replyMsg);
                    }).catch (err => {
                        const errMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: false, data: err }
                        port.postMessage(errMsg);
                    })

                    
                }
            })
        })
    }

    /**
     * 处理任务
     * @param task 
     * @param next 
     */
    public taskHandler(task: Target, next: () => void, component: BaseComponent) {
        console.log('[i]taskHandler: consumer task ', task.url);
        (component as SqlmapComponent).sdk.scanUrl(task.url);
        next();
    }

}