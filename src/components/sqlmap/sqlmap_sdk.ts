/**
 * sqlmapapi SDK
 * 
 * 通过接口， 发送扫描任务
 */

import { Request } from '@/utils/request';
import Singleton from '@/utils/singleton';

interface SqlmapTestParmater {
    url: string;   
}

export default class SqlmapSDK extends Singleton {
    private server = 'http://192.168.3.127:8775';
    private token = '478b1e9136bc32d01dcfcd2f44de87ee';

    constructor (api:string = '', token:string = '') {
        // this.token = token;
        // this.api = api;
        super();
    }

    /**
     * 快速开始扫描一个任务
     * @param url 
     * @returns 
     */
    public scanUrl(url:string):Promise<boolean> {
        let id:string;
        return this.createNewTask()
        .then(taskId => {
            id = taskId;
            return this.setTaskOptions(taskId,{ url })
        })
        .then(setOk => {
            console.log(`[i]set task: %c${id} options, setOK ${setOk}`, 'color: green, font-weight: 600')
            if (setOk) {
                return this.startTargetScan(id);
            }
        })
    }

    /**
     * 创建一个任务
     * @get("/task/new") Create new task ID. 
     * @param url
     * @param options
     * {
            "success": true,
            "taskid": "5bd92b225dd48d9f"
        }
     */
    public createNewTask():Promise<string> {
        const api = '/task/new';
        return Request.get(`${this.server}${api}`).then((res:any) => {
            if (!res.success) {
                throw (`create new task fail`);
            }
            console.log(`[i]New Task was create: %c${res.taskid}`, 'color: green');
            return res.taskid;
        }).catch(err => {
            console.error(`[e]start sacn fail: %c${err}`, 'color: green');
        })
    }

    /**
     * 设置任务参数
     * @post("/option/<taskid>/set") Set an option (command line switch) for a certain task ID
     * @param options 
     * 
     {
        "success": true
     }
     */
    public setTaskOptions(taskId: string, options:SqlmapTestParmater):Promise<boolean> {
        const api = `/option/${taskId}/set`;
        return Request.post(`${this.server}${api}`, options).then((res: any) => {
            if (res.success) {
                return true;
            }
            return false;
        }).catch(err => {
            console.error(`[e]set task ${taskId} options fail`, err);
            return false;
        });
    }

    /**
     * 开始一个扫描
     * @post("/scan/<taskid>/start") Launch a scan
     * @param url 
     {"getCurrentUser": true,"randomAgent": true, "getPrivileges": true, "getCurrentDb": true, "isDba": true, "getDbs": true,"getCount":true}
     * 
     {
        "success": true,
        "engineid": 148
    }
     */
    public startTargetScan(taskId: string) {
        const api = `/scan/${taskId}/start`;
        const params = {
            "threads": 5,"getCurrentUser": true,
            "randomAgent": true, "getPrivileges": true, 
            "getCurrentDb": true, "isDba": true, 
            "getDbs": true,"getCount":true,
            "technique": "BEUSQ",
        };
        return Request.post(
            `${this.server}${api}`,
            params
            ).then((res: any) => {
            return res.taskid;
        }).catch(err => {
            console.log('[e]start sacn fail', err);
        })
    }

    /**
     * @get("/option/<taskid>/list") List options for a certain task ID
     */
    public getTargetOptions(taskId: string) {
        const api = `/option/${taskId}/list`;
        return Request.get(`${this.server}${api}`).then((res: any) => {
            if (!res.success) {
                throw (`get task:${taskId} options fail`);
            }
            console.log(`[i]New Task was create: %c${res.taskid}`, 'color: green');
            return res.taskid;
        }).catch(err => {
            console.error(`[e]start sacn fail: %c${err}`, 'color: green');
        })
    }

    /**
     * 获取扫描状态
     * @get("/scan/<taskid>/status") Return status of a scan
     * 
     {
        "success": true,
        "status": "running",
        "returncode": null
    }
     */
    public getScanStatus(taskId: string) {

    }

    /**
     * 获取任务结果
     * @get("/scan/<taskid>/data") Retrieve the data of a scan
     */
    public getReuslt(taskId: string) {

    }

    /**
     * 删除任务
     * @get("/task/<taskid>/delete") Delete own task ID. 
     * @param taskId 
     */
    public delTask(taskId: string) {

    }

    /**
     * 停止一个扫描
     * @get("/scan/<taskid>/stop") Kill a scan
     * @param taskId 
     */
    public stopScan(taskId: string) {

    }

    /**
     * 
     * @get("/admin/list") List task pull
     * 
     {
        "success": true,
        "tasks": {
            "5bd92b225dd48d9f": "running"
        },
        "tasks_num": 1
    }
     */
    public getAllTaskList () {
        const api = `/admin/list`;
        return Request.get(`${this.server}${api}`).then((res: any) => {
            if (!res.success) {
                throw Error(`get all task list fail`);
            }
            return res.tasks;
        }).catch(err => {
            console.error(`[e]start sacn fail: %c${err}`, 'color: green');
        })
    }

    /**
     * 不传参数删除所有任务， 传参数删除对应任务
     * @get("/admin/<taskid>/flush") Flush task spool (delete all tasks). 
     */
    public cleanTasks(taskId?: string) {
        const api = taskId ? `/admin/${taskId}/flush` : '/admin/flush';
    }

    /**
     * 获取扫描日志
     * @get("/scan/<taskid>/log") Retrieve the log messages
     */
    public getScanLog(taskId: string) {

    }
}