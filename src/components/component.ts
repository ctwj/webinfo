import { ComponnetConfig } from './config';
import { ConfigType, ExtensionComponent } from './type';

import dayjs from 'dayjs';

/**
 * BaseComponent
 * background 和 content-script 分别有一个实例对象
 * 类里面变量不互通，如果需要互通使用 chrome.storage.locals
 */
export class BaseComponent implements ExtensionComponent {
    name = 'base';
    desc = 'component';
    canDisable = true;
    default_switch = true;

    public config = new ComponnetConfig(this.name,[]);

    // 开关key
    public getSwitchKey () {
        return `component_switch_${this.name}`;
    }

    // 组件开关
    public async getSwitch ():Promise<boolean> {
        return new Promise((resolve, reject) => {
            const key = this.getSwitchKey();
            chrome.storage.local.get([key], (items) => {
                if (items[key] === undefined) {
                    chrome.storage.local.set({[key]: this.default_switch})
                }
                resolve(items[key]);
            });
        });
    }

    public async setSwitch (enable: boolean) {
        chrome.storage.local.set({[this.getSwitchKey()]: enable})
    }

    /**
     * 组件是否已经启用
     * @returns 
     */
    public async isEnable() {
        return await this.getSwitch();
    }

    /**
     * content script
     * 注入到页面中的代码
     */
    public content(): void {
        
    }

    /**
     * background
     * 运行在 background 的代码
     */
    public background(): void {

    }

    
    public getConfig():ComponnetConfig {
        return this.config;
    }

    /**
     * Logger
     * @param info 
     * @param position 
     * @param type 
     */
    public logger(info:string | Object, position: string='background', type="info") {
        let str = '';
        if (typeof info === 'string') {
            str = info;
        } else {
            str = JSON.stringify(info);
        }
        const positionMap:{[key:string]:string} = {
            'background': 'color:red',
            'devtools': 'color:grey',
            'content-script': 'color:black',
        }
        const typeMap: { [key: string]: string } = {
            'info': 'color:black',
            'error': 'color:red',
            'warning': 'color:yellow',
        }
        console.log(
            `%c[${position.substring(0, 1).toUpperCase()}][${this.name}] %c[${dayjs().format('HH:mm:ss')}] %c${info}`,
            positionMap[position], 'color:#14161A',
            typeMap[type]
        );
    }

    /**
     * Logger
     * @param info 
     * @param position 
     * @param type 
     */
    public static logger(info: string, position: string = 'B', type = "info") {
        const positionMap: { [key: string]: string } = {
            'background': 'color:red',
            'devtools': 'color:grey',
            'content-script': 'color:black',
        }
        const typeMap: { [key: string]: string } = {
            'info': 'color:black;font-size:600;',
            'error': 'color:red',
            'warning': 'color:yellow',
        }
        console.log(
            `%c[${position.substring(0,1).toUpperCase()}][${this.name}] %c[${dayjs().format('HH:mm:ss')}] %c${info}`,
            positionMap[position], 'color:#14161A',
            typeMap[type]
        );
    }
}