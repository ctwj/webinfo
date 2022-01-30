// request.ts
import qs from "qs";
import superagent from "superagent"

export class Request {
    /**
     * get方法
     * @param {string} url 路径
     * @param {object} params 参数
     */
    static get = (url: string) => {
        return fetch(url).then(response => response.json());
    }

    static post = (url: string, params: object = {}) => {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(params)
        }).then(response => response.json());
    }
}