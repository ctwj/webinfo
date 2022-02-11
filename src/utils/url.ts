/**
 * UrlInfo
 * 计算urlmd5
 */

import md5 from 'md5';

export class UrlInfo {

    public url:string;

    /**
     * 构造函数
     * @param {string} url 
     */
    constructor(url:string) {
        this.url = url;
    }

    /**
     * 计算urlhash, 去除参数值
     */
    get_url_hash() {
        let u = new URL(this.url);
        u.hash = '';
        u.searchParams.sort();
        // @ts-ignore
        [...u.searchParams].map(item => item[0]).map(k => u.searchParams.set(k, ''));
        return md5(u.href);
    }

    get_hash() {
        return md5(this.url);
    }

    /**
     * 计算参数 hash，10个长度
     * 
     * @param {string} param 
     */
    get_paramter_hash(param:string, len = 10) {
        return md5(param).substr(3, len);
    }

    /**
     * 传入payload列表,生成测试列表
     * @param {array} list 
     */
    create_xss_payload(list:string[]) {

    }

}