
export interface ExtensionComponent {
    name: string;
    desc: string;
    content():void;
    background():void;
}


/**
 * 组件类型s
 */
export enum ConfigType {
    INPUT = 'input',
    // CHECKBOX = 'checkbox',
    SELECT = 'selection',
}

/**
 * 组件配置项
 */
export interface ConfigItem {
    type: ConfigType;
    name: string;
    title: string;
    description: string;
    default: boolean | string;
    options?: {label: string, value: string}[];
    value: any;
}

export enum ErrorCode {
    FETCH_FAIL = 'fetch_fail',
    SQLMAPIAPI_NOT_CONFIG = 'sqlmapapi not config',
}

export const getErrorByCode = (code: ErrorCode) => {
    const errorMap:Record<ErrorCode, string> = {
        [ErrorCode.FETCH_FAIL]: '请求接口失败！',
        [ErrorCode.SQLMAPIAPI_NOT_CONFIG]: 'SqmapApi 未配置！',
    }
    return errorMap[code];
}

export interface ApiResult {
    success: boolean;
    code?: string;
    data?: any;
}