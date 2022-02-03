
export const PORT_NAME = 'sqlmap-channel';

// 命令
export interface Command {
    command: MSG;
}

// 命令返回结构
export interface CommandReply {
    command: MSG;
    success: boolean;
    data?: any;
    errorCode?: string;
}

// 消息名字
export enum MSG {
    // sqlmap 任务列表s
    TASK_LIST = 'getTaskList',
    TASK_LIST_REPLY = 'getTaskListReply',
    // sqlmap 任务 数据
    TASK_DATA = 'getTaskData',
    TASK_DATA_REPLY = 'getTaskDataReply',
    // 移除 sqlmap 任务
    TASK_REMOVE = 'taskRemove',
    TASK_REMOVE_REPLY = 'taskRemoveReply',
}

// 任务状态
export enum TASK_STATUS {
    RUNNING = 'running',
    NOT_RUNNING = 'not running',
    FINISH = 'terminated',
}

export interface TableRecord {
    taskId: string,
    status: TASK_STATUS,
    inject?: boolean,
    hostname?: string,  // 域名
    url?: string, // url
    data?: object,
}