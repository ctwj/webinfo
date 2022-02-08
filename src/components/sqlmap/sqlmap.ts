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
            description: "sqlmap api 地址,  结尾不要有反斜线，直接访问地址， 如果界面显示 ‘Nothing here’ 则是一个有效的api地址",
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
        if (!await this.isEnable() || !await this.getConfig().get('sqlmapapi')) {
            console.warn('需要开启sqlmap，并配置sqlmapapi');
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
    public static createTableRecord (taskId:string, url: string) {
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
    private async taskListMsgHandler (msg: Command, port: chrome.runtime.Port) {
        let cmdMsg: Command = msg;

        // 获取任务列表
        if (cmdMsg.command === MSG.TASK_LIST) {
            
            const cache = new SqlmapCache();
            // cache.print(); 

            // 可以配置服务器地址，所以这里获取列表每次都更新下服务器地址
            this.sdk?.resetServer(await this.getConfig().get('sqlmapapi'));
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
                        const target = SqlmapComponent.createTableRecord(taskId, options.url);
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
     * 获取 任务log
     * @param msg 
     * @param port 
     */
    private async taskLogHandler (msg: Command, port: chrome.runtime.Port) {
        this.sdk?.getScanLog(msg.taskId as string).then(async res => {
            const replyMsg: CommandReply = { command: MSG.TASK_LOG_REPLY, success: true, data: res }
            port.postMessage(replyMsg);
        }).catch((err: any) => {
            console.log('get taskk log error:', err);
            const errMsg: CommandReply = { command: MSG.TASK_LIST_REPLY, success: false, data: err }
            port.postMessage(errMsg);
        })
    }

    /**
     * 获取 任务detail
     * @param msg 
     * @param port 
     */
    private async taskDetailHandler(msg: Command, port: chrome.runtime.Port) {
        const uri = new URL(msg.url as string);
        this.sdk?.downloadTask(msg.taskId as string, uri.hostname, 'log').then(async res => {
            const replyMsg: CommandReply = { command: MSG.TASK_DETAIL_REPLY, success: true, data: res }
            port.postMessage(replyMsg);
        }).catch((err: any) => {
            console.log('get taskk download error:', err);
            const errMsg: CommandReply = { command: MSG.TASK_DETAIL_REPLY, success: false, data: err }
            port.postMessage(errMsg);
        })
    }

    /**
     * 开始 任务
     * @param msg 
     * @param port 
     */
    private async taskStartHandler(msg: Command, port: chrome.runtime.Port) {
        this.sdk?.startTargetScan(msg.taskId as string).then(async res => {
            const replyMsg: CommandReply = { command: MSG.TASK_START_REPLY, success: true, data: true }
            port.postMessage(replyMsg);
        }).catch((err: any) => {
            console.log('task start error:', err);
            const errMsg: CommandReply = { command: MSG.TASK_START_REPLY, success: false, data: err }
            port.postMessage(errMsg);
        })
    }

    /**
     * 删除 任务
     * @param msg 
     * @param port 
     */
    private async taskDeleteHandler(msg: Command, port: chrome.runtime.Port) {
        if (msg.taskId) {
            this.sdk?.delTask(msg.taskId as string).then(async res => {
                const replyMsg: CommandReply = { command: MSG.TASK_DELETE_REPLY, success: true, data: res }
                port.postMessage(replyMsg);
            }).catch((err: any) => {
                console.log('get taskk download error:', err);
                const errMsg: CommandReply = { command: MSG.TASK_DELETE_REPLY, success: false, data: err }
                port.postMessage(errMsg);
            })
        }
        if (msg.taskIds) {
            let taskList = [] as Promise<boolean>[];
            msg.taskIds.forEach(taskId => {
                taskList.push(new Promise(() => this.sdk?.delTask(taskId)));
            })
            Promise.all([...taskList]).then(() => {
                const replyMsg: CommandReply = { command: MSG.TASK_DELETE_REPLY, success: true, data: true }
                port.postMessage(replyMsg);
            }).catch ((err: any) => {
                console.log('remove tasks error:', err);
                const errMsg: CommandReply = { command: MSG.TASK_DELETE_REPLY, success: false, data: err }
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
                console.log(`[i]get message from port ${JSON.stringify(msg)}`);
                switch( msg.command) {
                    case MSG.TASK_LIST:
                        this.taskListMsgHandler(msg, port);
                        break;
                    case MSG.TASK_LOG:
                        this.taskLogHandler(msg, port);
                        break;
                    case MSG.TASK_DETAIL:
                        this.taskDetailHandler(msg, port);
                        break;
                    case MSG.TASK_DELETE:
                        this.taskDeleteHandler(msg, port);
                        break;
                    case MSG.TASK_START:
                        this.taskStartHandler(msg, port);
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
    public static scanUrlCallback(taskId:string, url: string) {
        new SqlmapCache().set(taskId, SqlmapComponent.createTableRecord(taskId, url));
    }

    /**
     * 处理任务
     * @param task 
     * @param next 
     */
    public taskHandler(task: Target, next: () => void, component: BaseComponent) {
        console.log('[i]taskHandler: consumer task ', task.url);
        (component as SqlmapComponent).sdk?.scanUrl(task.url, SqlmapComponent.scanUrlCallback);
        next();
    }

}