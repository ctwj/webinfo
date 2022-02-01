/**
 * 单例
 */
export default class Singleton {
    private static _instance:any;
    constructor() {
        if (!Singleton._instance) {
            Singleton._instance = this;
        }
        return Singleton._instance;
    }
    static getInstance() {
        return this._instance;
    }
}