import { ComponnetConfig } from './config';
import { ConfigType, ExtensionComponent } from './type';

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
}