import { BaseComponent } from "@/components/component";

import Task from "@/utils/task";
import SqlmapSDK from "./sqlmap_sdk";
import { ComponnetConfig } from "../config";
import SqlmapCache from "./cache";

import { Command, CommandReply, MSG, TableRecord, TASK_STATUS } from './const';
import { Table } from "element-plus/lib/el-table/src/table.type";
import { ConfigType } from "@/components/type";
import Message from "element-plus/lib/el-message/src/message";


interface SearchResultMessage {
    type: string; // 'sqlmap-search-urls';
    data: string[];
}

interface Target {
    url: string;
}

export class SqlmapComponent extends BaseComponent {

    // component public
    public name = "sqlmap";
    public desc = "获取google的搜索结果， 发送到sqlmapapi接口中";
    public config = new ComponnetConfig(
        this.name,
        [{
            type: ConfigType.INPUT,
            name: "sqlmapapi",
            title: "SqlmapApi Address",
            description: "sqlmap api 地址, 配置地址后，插件能够自动通过sqlmapapi检测sql注入漏洞",
            default: '',
            value: '',
        },
        // {
        //     type: ConfigType.SELECT,
        //     name: "sqlmap-select",
        //     title: "SqlmapApi select",
        //     description: "sqlmap api 地过sqlmapapi检测sql注入漏洞",
        //     options: [
        //         {label: 'Select One Items', value: 'one'}, {label: 'Select Two Items', value: 'two'}
        //     ],
        //     default: 'two',
        //     value: '',
        // }
        ]
    );

    // component special
    public task = new Task<Target>(this.taskHandler, this);
    public sqlmapapi = '';
    public sdk:SqlmapSDK | null = null;

    /**
     * 
     */
    constructor () {
        super();
        this.initSDK();
    }

    private async initSDK () {
        this.sqlmapapi = await this.config.get('sqlmapapi');
        this.sdk = new SqlmapSDK(this.sqlmapapi);
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
     * 默认数据
     */
    private createTableRecord (taskId:string, url: string) {
        const uri = new URL(url);
        return {
            taskId,
            url,
            hostname: uri.hostname,
            status: TASK_STATUS.NOT_RUNNING,
            inject: false,
            data: {}
        }
    }

    // ========================= 后台 background ==========================

    /**
     * 获取 任务列表事件处理
     * @param port 
     */
    private taskListMsgHandler (msg: Command, port: chrome.runtime.Port) {
        let cmdMsg: Command = msg;
    
        console.log('message from page', msg);

        // 获取任务列表
        if (cmdMsg.command === MSG.TASK_LIST) {
            
            const cache = new SqlmapCache();
            cache.print();

            this.sdk?.getAllTaskList().then( async res => {

                // getAllTaskList 存在异常场景
                if (res.success === false) {
                    const replyMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: false, errorCode: res?.code }
                    port.postMessage(replyMsg);
                    return;
                }

                // res => 从缓存中获取数据
                let result:TableRecord[] = [];
                for (let key in res.data) {
                    const taskId = key;

                    if (cache.isExists(key)) {
                        result.push(cache.get(key) as TableRecord);
                    } else {
                        const options = await this.sdk?.getTargetOptions(taskId);
                        if (!options.url) {
                            continue;
                        }
                        const target = this.createTableRecord(taskId, options.url);
                        target.status = res.data[key];
                        if (target.status === TASK_STATUS.FINISH) {
                            const resultData = await this.sdk?.getReuslt(taskId);
                            if (target.status === TASK_STATUS.FINISH) {
                                target.inject = !!resultData.length;
                            }
                            console.log(`${taskId} getReuslt`, resultData);
                        }
                        result.push(target)

                        // 保存缓存
                        new SqlmapCache().set(taskId, target);
                    }
                }
                const replyMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: true, data: result }
                port.postMessage(replyMsg);
            }).catch ((err: any) => {
                console.log('get all taskk list error:', err);
                const errMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: false, data: err }
                port.postMessage(errMsg);
            })
        }
    }

    /**
     * 后台运行, 
     */
    public background() {

        // 监听 google 获取到的 url
        chrome.runtime.onMessage.addListener((message: SearchResultMessage, sender, sendResponse) => {
            console.log(message);
            if (message?.type === 'sqlmap-search-urls') {
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

                switch( msg.type) {
                    case MSG.TASK_LIST:
                        this.taskListMsgHandler(msg, port);
                        break;
                    default:
                }
                
            })
        })
    }

    /**
     * 添加任务后， 缓存任务
     * @param taskId 任务ID
     * @param url 任务url
     */
    private scanUrlCallback(taskId:string, url: string) {
        new SqlmapCache().set(taskId, this.createTableRecord(taskId, url));
    }

    /**
     * 处理任务
     * @param task 
     * @param next 
     */
    public taskHandler(task: Target, next: () => void, component: BaseComponent) {
        console.log('[i]taskHandler: consumer task ', task.url);
        (component as SqlmapComponent).sdk?.scanUrl(task.url, this.scanUrlCallback);
        next();
    }

}