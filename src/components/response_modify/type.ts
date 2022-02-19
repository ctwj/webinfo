

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
}

export interface BaseRequestData {
    data: string[];
    headers: [];
    method: string;
    path: string;
    url: string;
}
