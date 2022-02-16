

// 消息名字
export enum MSG {
    CACHE_CHECK = 'cacheCheck',
    CACHE_CHECK_REPLY = 'cacheCheckReply',
}

// 命令
export interface Command {
    command: MSG;
    args: {[key:string]:any};
}

// 命令返回结构
export interface CommandReply {
    command: MSG;
    success: boolean;
    data?: any;
    errorCode?: string;
}

// xss 
export const REMOVE_XSS_RULE_ID = 10001;