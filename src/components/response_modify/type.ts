// 命令
export interface Command {
    command: MSG;
    args: { [key: string]: any };
}

export interface HookerConfig {
    isHooked: boolean;
}

export interface ReplaceRules {
    filterType: string;
    switchOn: boolean;
    match: string;
    overrideText: string;
}

// 消息名字
export enum MSG {
    NOTICE = 'notice',
    MATCHED = 'matched',
    ADD_RULE = 'addRule',
    REMOVE_RULE = 'removeRule',
    EDIT_RULE = 'editRule',
}

export interface BaseRequestData {
    data: any[];
    headers: Array<any>;
    method: string;
    path: string;
    url: string;
}
