import { BaseComponent } from "../component";

export class SqlmapComponent extends BaseComponent {

    public name = "sqlmap";
    public desc = "获取google的搜索结果， 发送到sqlmapapi接口中";

    /**
     * 
     */
    constructor () {
        super();
    }

    /**
     * 
     */
    public init () {

    }

    /**
     * 注入在 content-script 中代码
     * 获取sqlmap的搜索结果发送到sqlmapapi接口中
     */
    public async content () {
        if (!await this.isEnable()) {
            return;
        }
        window.console.log('ab');
    }

}