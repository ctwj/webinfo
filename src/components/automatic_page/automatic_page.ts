import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";


export class SqlmapComponent extends BaseComponent {

    // component public
    public name = "automatic_page";
    public desc = "搜索引擎自动翻页";
    public config = new ComponnetConfig(
        this.name,
        [
        // {
        //     type: ConfigType.INPUT,
        //     name: "sqlmapapi",
        //     title: "SqlmapApi Address",
        //     description: "sqlmap api 地址, 配置地址后，插件能够自动通过sqlmapapi检测sql注入漏洞",
        //     default: '',
        //     value: '',
        // },
        // {
        //     type: ConfigType.SELECT,
        //     name: "sqlmap-select",
        //     title: "SqlmapApi select",
        //     description: "sqlmap api 地过sqlmapapi检测sql注入漏洞",
        //     options: [
        //         {label: 'Select One Items', value: 'one'}, {label: 'Select Two Items', value: 'two'}
        //     ],
        //     default: 'two',
        //     value: '',
        // }
        ]
    );


    /**
     * 
     */
    constructor () {
        super();
    }

    /**
     * 注入在 content-script 中代码
     * 自动翻页
     */
    public async content () {

        // 自动翻页， 需要触发

    }

}