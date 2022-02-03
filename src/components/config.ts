import { resolve } from "path/posix";
import { config } from "process";
import { ConfigItem } from "./type";


export class ComponnetConfig {

    private componentName:string;
    private configs: ConfigItem[];

    constructor (componentName:string, configs:ConfigItem[]) {
        this.componentName = componentName;
        this.configs = configs;
    }

    /**
     * 更具configName 获取key
     * @param configName 
     * @returns 
     */
    private getKey(configName:string) {
        return `${this.componentName}_config_${configName}`;
    }

    /**
     * 获得配置
     * @param configName 
     * @returns 
     */
    private getConfigItem(configName:string) {
        return this.configs.find(item => item.name === configName);
    }

    /**
     * 获取所有的key
     */
    public async getConfigs() {
        this.configs.forEach(async config => {
            config.value = await this.get(config.name);
        });
        return this.configs;
    }

    public get (name: string): Promise<any> {
        const item = this.getConfigItem(name);
        const key = this.getKey(name);
        return new Promise((resolve,reject) => {
            if (!item) {
                resolve('');
            }
            chrome.storage.local.get([key], (items) => {
                if (items[key] === undefined) {
                    chrome.storage.local.set({[key]: item?.default});
                    resolve(item?.default);

                } else {
                    resolve(items[key]);
                }
            })
        })
    }

    public set (configName:string, value: string | boolean) {
        const key = this.getKey(configName);
        console.log(`${key} set to ${value}`);
        return chrome.storage.local.set({[key] : value});
    }

}