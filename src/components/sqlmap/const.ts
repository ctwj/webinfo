
export const PORT_NAME = 'sqlmap-channel';

export interface Command {
    command: string;
}

export const MSG = {
    // sqlmap 任务列表s
    TASK_LIST: 'getTaskList',
    TASK_LIST_REPLY: 'getTaskListReply',
    // sqlmap 任务 数据
    TASK_DATA: 'getTaskData',
    TASK_DATA_REPLY: 'getTaskDataReply',
    // 移除 sqlmap 任务
    TASK_REMOVE: 'taskRemove',
    TASK_REMOVE_REPLY: 'taskRemoveReply',
}