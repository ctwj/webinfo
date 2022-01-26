import { ExtensionComponent } from './type';

export class BaseComponent implements ExtensionComponent {
    name = 'base';
    desc = 'component';
    
    default_switch = true;

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

    /**
     * 组件是否已经启用
     * @returns 
     */
    public async isEnable() {
        return await this.getSwitch();
    }

    public content(): void {
        
    }
}