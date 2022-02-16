import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";
import { ConfigType, PARENT_MENU_ID } from "../type";
import parse5 from 'parse5';

import { CacheList } from "@/utils/cache_list";
import { UrlInfo } from "@/utils/url";
import { Command, MSG, REMOVE_XSS_RULE_ID } from "./const";

/**
 * Xss 检测组件
 */
export class XssComponent extends BaseComponent {

    public name = "xss-checker";
    public desc = "检测页面可能存在 xss 漏洞";

    public cache_list;

    /**
     * 配置项
     */
    public config = new ComponnetConfig(
        this.name,
        [
            // {
            //     type: ConfigType.INPUT,
            //     name: "sqlmapapi",
            //     title: "SqlmapApi Address",
            //     description: "sqlmap api 地址,  结尾不要有反斜线，直接访问地址， 如果界面显示 ‘Nothing here’ 则是一个有效的api地址",
            //     default: '',
            //     value: '',
            // },
        ]
    );


    /**
     * 
     */
    constructor() {
        super();
        this.cache_list = new CacheList<string>(100);
    }

    /**
     * 移除xss保护头
     */
    private async remove_xss_protect_flag() {
        const enable = await this.isEnable();

        chrome.declarativeNetRequest.updateDynamicRules(
            {
                addRules: [{
                    id: REMOVE_XSS_RULE_ID,
                    priority: 1,
                    action: { 
                        type: chrome.declarativeNetRequest.RuleActionType.MODIFY_HEADERS,
                        responseHeaders: [
                            {
                                header: 'X-XSS-Protection',
                                operation: 'set' as chrome.declarativeNetRequest.HeaderOperation,
                                value: '0'
                            }
                        ]
                    },
                    condition: { 
                        urlFilter: "*://*/*", 
                        resourceTypes: [
                            chrome.declarativeNetRequest.ResourceType.MAIN_FRAME,
                            chrome.declarativeNetRequest.ResourceType.SUB_FRAME,
                        ]
                    }
                }]
            },
            async (result:any) => {
                console.log('created', result);
            }
        )
        // export enum ResourceType {
        //     MAIN_FRAME = "main_frame",
        //     SUB_FRAME = "sub_frame",
        //     STYLESHEET = "stylesheet",
        //     SCRIPT = "script",
        //     IMAGE = "image",
        //     FONT = "font",
        //     OBJECT = "object",
        //     XMLHTTPREQUEST = "xmlhttprequest",
        //     PING = "ping",
        //     CSP_REPORT = "csp_report",
        //     MEDIA = "media",
        //     WEBSOCKET = "websocket",
        //     OTHER = "other"
        // }

        /**
         * 注册onHeadersReceived处理事件
         * https://crxdoc-zh.appspot.com/extensions/webRequest
         * 
         * 接收到请求头消息的时候， 检测头部是否有X-XSS-Protection，其值为0时表示关闭XSS保护
         * 如果有关闭，如果没有添加一个X-SS-Protecection为0
         */
        // chrome.webRequest.onHeadersReceived.addListener(details => {
        //     let xssFlag = true;
        //     let cspFlag = true;

        //     const headerLength = details?.responseHeaders?.length ?? 0;

        //     if (!details) {
        //         return;
        //     }

        //     for (var i = 0; i < headerLength; ++i) {
        //         let headers = details.responseHeaders ?? [];
        //         let header: chrome.webRequest.HttpHeader = headers[i];
        //         if (header.name == 'conent-security-policy') {
        //             console.log('conent-security-policy', header.value);

        //             // 重复关键字第一次生效，所以插入的放在最前面
        //             header.value = "script-src 'unsafe-inline' 'unsafe-eval'; " + header.value; 
        //             cspFlag =false;
        //         }
        //         if (header.name == 'X-XSS-Protection') {
        //             console.log('X-XSS-Protection', header.value);
        //             header.value = '0';
        //             xssFlag = false;
        //         } else if (header.name == 'x-frame-options') {
        //             delete headers[i];
        //             i--;
        //         }
        //     }
        //     if (xssFlag) {
        //         console.log('X-XSS-Protection set ', 0);
        //         details?.responseHeaders?.push({ name: "X-XSS-Protection", value: "0" });
        //     }
        //     if (cspFlag) {
        //         console.log('conent-security-policy set ', "script-src 'unsafe-inline' 'unsafe-eval'");
        //         details?.responseHeaders?.push({ name: "conent-security-policy", value: "script-src 'unsafe-inline' 'unsafe-eval'" });
        //     }
        //     return { responseHeaders: details.responseHeaders };
        // }, { urls: ["<all_urls>"], types: ["main_frame", "sub_frame"] }, ['blocking', 'responseHeaders']);

    }

    /**
     * hash 检查,判断是否进行过检测
     */
    hash_check() {
        //接收content_scripts发送过来的消息, 确认是否需要扫描
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            // 检测消息来源
            const command:Command = request;

            let { hash, url } = request.args;
            // 是否检测过相同的页面了
            if (this.cache_list.has(hash)) {
                sendResponse({ needscan: false, url: url })
            } else {
                //添加缓存
                this.cache_list.add(hash, this.name);
                sendResponse({ needscan: true, url: url })
            }

        });

    }

    // ============================== background =======================

    /**
     * background
     */
    public background(): void {
       this.remove_xss_protect_flag();
       this.hash_check();
    }

    // ============================== content script =======================



    /**
     * 注入在 content-script 中代码
     * 自动翻页
     */
    public async content() {

        /**
         * 选择在 content-script 中进行前期准备工作.
         * 
         * 1. 参数检测
         * 
         * 2. 重复打开的链接太多，做一个cache，尽量减少重复的扫描，
         * 这个检测将发送到后台后做
         * 
         */
        let uri = new URL(window.location.href);
        console.log(uri);
        if (uri.hash == '' && uri.searchParams.toString() === '') {
            return;
        }

        /**
         * 正式开始寻找, 1.先验证是否已经扫描过
         * 将页面的url发送给background
         */
        let url_info = new UrlInfo(uri.href);
        chrome.runtime.sendMessage(
            { 
                command:MSG.CACHE_CHECK, 
                args:{
                    url: uri.href, 
                    hash: url_info.get_url_hash()
                }
            }, 
            (res) => {
                if (res && res.needscan) {
                    this.scan(url_info);
                }
            }
        );
    }

    /**
     * 注册结果监听器,当页面发现触发xss发送Message
     */
    register_result_watcher() {
        window.addEventListener('message', event => {
            console.log('get Message from sandbox, mayby was bug');
            // this.log('get Message from sandbox, mayby was bug');
            // if (!event.data.component || event.data.component != this.ns) {
                // return;
            // }
            // this.debug(event.data);
        });
    }

    /**
     * 开始扫描
     */
    private scan(url_info:UrlInfo) {
        this.register_result_watcher();

        let url = url_info.url;
        //检测是否可能有xss漏洞
        // this.debug(`step 1: ${url}`)
        //遍历所有参数 url
        let url_obj = new URL(url);
        // @ts-ignore
        [...url_obj.searchParams.keys()].map(k => {
            let uri = new URL(url);
            if (uri.searchParams.has(k)) {
                let hash_str = url_info.get_paramter_hash(k);
                uri.searchParams.set(k, uri.searchParams.get(k) + hash_str)
                //第一步检测
                this.maybe_xss(k, hash_str, uri.href, url)
            } else {
                // this.debug(`paramter:${k} is safe!`);
            }
        });
        if (url_obj.hash != '') {
            let tmp = 'ab23ctwj32ba';
            this.maybe_xss('x_hash_x', tmp, url + tmp, url)
        }
    }

    /**
     * 验证url的返回结果里面是否包含hash值 
     * //TODO（是否需要添加特定的参数叫是的backgound请求，不被其他组件重复处理）
     * 
     * @param {string} k            参数名
     * @param {string} hash_str     hash
     * @param {string} check_url    检测的url已经改成hash
     * @param {string} source_url   原始检测url
     */
    private maybe_xss(k:string, hash_str:string, check_url:string, source_url:string) {
        fetch(check_url, { credentials: 'include' }).then(response => response.text()).then(data => {
            if (data.indexOf(hash_str) > 0) {
                // 检测到了关键字
                // this.debug(`keyword[${k}] hash possible`)

                // 确认关键字位置
                let doc = parse5.parse(data);
                console.log(doc);
                let positions = this.find_hash_position(doc, hash_str);
                if (positions.length == 0) {
                    // this.error('没有找到关键字出现的位置')
                }

                //获取payload
                let payloads = this.get_payload();

                //扫描 参数k
                payloads.map(payload => {
                    // this.debug(source_url);
                    let uri = new URL(source_url);
                    k == 'x_hash_x' ? uri.hash += payload : uri.searchParams.set(k, uri.searchParams.get(k) + payload)
                    // this.debug(payload);
                    // this.debug(`uri.href ${uri.href}`);
                    // 开始创建iframe
                    this.create_testframe(uri.href, source_url, k, payload);
                })

            } else {
                // this.debug(`keyword[${k}] not exists hash value ${hash_str}`)
            }
        }).catch(e => {
            // this.debug(`fetch fail`, e);
        })
    }

    /**
     * 根据关键字出现位置,获取payload
     * 
     * @param {obj} position 
     * [{"tagName":"script","position":"attr.value","attr":"src","debug":"jquery.js#testxx669d19b675"},{"nodeName":"div","position":"content","debug":"\n        XSS testxx669d19b675       \n        "}]
     */
    private get_payload(position:string = '') {
        let result = [];
        // result = [
        //     '<img src=x onerror=alert({id})>',
        //     '<script>alert({id})</script>',
        //     '"><img src=x onerror=alert({id})>',
        //     '" onload=alert({id})',
        //     "\"><img src=x onerror=alert({id})>",
        //     "</script><svg/onload=alert({id})>",
        //     "<body onload=alert({id})>",
        //     "<svg onload=alert`{id}`>",
        //     "<svg onload=alert&lpar;{id}&rpar;>",
        //     "<svg onload=alert&#x28;{id}&#x29>",
        //     "<svg onload=alert&#40;{id}&#41>",
        //     "--!><svg/onload=prompt({id})",
        //     "--><script>alert({id})</script>",
        //     "&lt;script&gt;alert(&#39;{id}&#39;);&lt;/script&gt;",
        //     "< / script >< script >alert({id})< / script >",
        //     "<sc<script>ript>alert({id})</sc</script>ript>",
        //     "<script\\x20type=\"text/javascript\">javascript:alert({id});</script>",
        //     "'`\"><\\x3Cscript>javascript:alert({id})</script>",
        //     "<<SCRIPT>alert(\"{id}\");//<</SCRIPT>"
        // ]
        result = [
            '<img src=x onerror=alert({id})>'
        ]
        return result;
    }

    /**
     * 找出关键字出现的位置
     * @param {parse5} node     html源码解析后的对象
     * @param {string} hash    关键字
     * 
     * @return array
     */
    private find_hash_position(node: parse5.ChildNode | parse5.Document, hash:string) {
        let result: any[] = [];
        let sub_result = [];

        // 递归调用
        if ((node as parse5.Document).childNodes && (node as parse5.Document).childNodes.length > 0) {
            for (let i in (node as parse5.Document).childNodes) {
                // @ts-ignore
                sub_result = this.find_hash_position(node.childNodes[i], hash);
                if (sub_result.length > 0) {
                    result = [...result, ...sub_result];
                }
            }
        }
        // 文本判断
        if (node.nodeName == '#text' && (node as parse5.TextNode).value && (node as parse5.TextNode).value.indexOf(hash) >= 0) {
            result.push({ nodeName: node.parentNode.nodeName, position: 'content', debug: (node as parse5.TextNode).value });
        }
        // tag 判断
        if (node.nodeName.indexOf(hash) >= 0) {
            result.push({ nodeName: 'tag', position: 'tag' });
        }

        //属性判断
        if ((node as parse5.Element).tagName 
            && (node as parse5.Element).tagName != '' 
            && (node as parse5.Element).attrs 
            && (node as parse5.Element).attrs.length > 0) {

            if ((node as parse5.Element).tagName.indexOf(hash) > 0) {
                result.push({ tagName: (node as parse5.Element).tagName, position: 'tagName' })
            }
            (node as parse5.Element).attrs.map((pair: { name: string | string[]; value: string | string[]; }) => {
                // console.log(pair)
                if (pair.name.indexOf(hash) > 0) {
                    result.push({ tagName: (node as parse5.Element).tagName, position: 'attr.name', attr: pair.name, debug: pair.name })
                }
                if (pair.value.indexOf(hash) > 0) {
                    result.push({ tagName: (node as parse5.Element).tagName, position: 'attr.value', attr: pair.name, debug: pair.value })
                }
            })

        }
        return result;
    }

    /**
     * 创建测试iframe
     * @param {*} url           测试url已经添加payload
     * @param {*} source_url    原始url
     * @param {*} k             参数
     * @param {*} payload       payload
     */
    private create_testframe(url:string, source_url:string, k:string, payload:string) {
        fetch(url).then(response => response.text()).then(data => {
            console.debug(`url parameter ${url}`);
            let url_info = new UrlInfo(url);
            let frame = document.createElement('iframe');
            let id = url_info.get_hash();
            let info = JSON.stringify({ url: source_url, param: k, payload: escape(payload), component: this.name });

            frame.setAttribute('id', id);
            frame.setAttribute('data-url', url);
            // frame.src = url;
            frame.style.display = 'none';
            document.body.appendChild(frame);
            frame.contentWindow?.document.open();
            // 改写alert,如果触发alert向父窗体发送消息

            const alertFunc = `<script>function alert(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            const promptFunc = `<script>function prompt(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            const confireFunc = `<script>function confire(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            const mounseFunc = `<script>
            setTimeout(function() {
                document.querySelectorAll('a').forEach((element) => {
                var href = element.getAttribute('href');if (href && href.indexOf('javascript:') == 0) element.click()
                var onmouseover = element.getAttribute('onmouseover')
                if (onmouseover && onmouseover.indexOf('javascript:') == 0) element.onmouseover()
            })}, 1000)</script>`;

            const testData = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
    <script src="jquery.js#test<img src=x onerror=alert({id})>"></script>
    ${alertFunc}
    ${promptFunc}
    ${confireFunc}
    ${mounseFunc}
    <style>
        * {
            margin: 0 0;
            padding: 0 0;
        }
        html,body{
            height: 100%;
            width: 100%;
            background-color: black;
        }
        .div {
            color: aquamarine;
            font-weight: 900;
            font-size: 68px;
            text-align: center;
            vertical-align:middle;
            padding: 150px;
        }
        ul {
            font-weight: 400;
            font-size: 18px;
            margin: 5px;
        }
    </style>
</head>
<body>
    <div class="div">
        XSS test<img src=x onerror=alert({id})>       
        <ul>
            <li><a href="./xss.php?p=1&v=test">注入点html中</a></li>
        </ul>
    </div>
</body>
</html>`;

            // const alertFunc = `<script>function alert(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            // const promptFunc = `<script>function prompt(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            // const confireFunc = `<script>function confire(m){setTimeout(function(){parent.postMessage(${info},'*')},500);}</script>`;
            // const mounseFunc = `<script>
            // setTimeout(function() {
            //     document.querySelectorAll('a').forEach((element) => {
            //     var href = element.getAttribute('href');if (href && href.indexOf('javascript:') == 0) element.click()
            //     var onmouseover = element.getAttribute('onmouseover')
            //     if (onmouseover && onmouseover.indexOf('javascript:') == 0) element.onmouseover()
            // })}, 1000)</script>`;

            frame.contentWindow?.document.write(data);

            // frame.contentWindow?.document.write(alertFunc);
            // frame.contentWindow?.document.write(promptFunc);
            // frame.contentWindow?.document.write(confireFunc);
            // frame.contentWindow?.document.write(mounseFunc);
            // 5秒后消除iframe
            // frame.contentWindow.document.write(`
            // <script>
            // setTimeout(
            // "top.document.body.removeChild(top.document.getElementById('${id}'));"
            // ,5000)
            // </script>`)

            //Anti framebusting
            // window.fun = new Function('top', evt.data.script);
            frame.contentWindow?.document.write(`
            <script>
            window.fun = function top() {
                return evt.data.script;
            };
            </script>`)

            frame.contentWindow?.document.close()

            // setTimeout(`frame.contentWindow.document.write('');//清空iframe的内容
            // frame.contentWindow.close();//避免iframe内存泄漏
            // frame.remove();//删除iframe`,5000);
        });
    }

}