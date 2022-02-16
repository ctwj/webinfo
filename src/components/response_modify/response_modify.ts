import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";

import { ReplaceRules, HookerConfig } from './type';

/**
 * response-modify
 * 接口返回值修改， 
 * 1. 记录api
 * 2. 点击api，修改返回值， 保存成返回实例， 可以保存多个，进行切换
 */
export class ResponseModifyComponent extends BaseComponent {

    // component public
    public name = "response-modify";
    public desc = "接口返回值修改器， 修改 api 返回值";


    /**
     * 配置项
     */
    public config = new ComponnetConfig(
        this.name,
        [
            {
                name: "rules",
                title: "response modify rules",
                visable: false,
                description: "配置的替换规则",
                default: [],
                value: [],
            },
        ]
    );


    /**
     * 
     */
    constructor() {
        super();
    }

    // ============================== background =======================

    /**
     * background
     */
    public background(): void {

    }

    // ============================== content script =======================



    /**
     * 注入在 content-script 中代码
     */
    public async content() {
        const enable = await this.isEnable();
        const config:HookerConfig = { isHooked: enable };
        const rules:ReplaceRules[] = await this.getConfig().get('rules');
        

        var file = chrome.runtime.getURL('inject.js')
        var s = document.createElement('script')
        s.type = 'text/javascript'
        s.src = file
        document.documentElement.appendChild(s)

    }


}