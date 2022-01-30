// 单例class
export default class Singleton {
    static instance: Singleton;

    constructor() {
        if(!Singleton.instance) {
            Singleton.instance = this
        }
        return Singleton.instance
    }
    
    static getInstance() {
        if (!this.instance) {
            return this.instance = new Singleton()
        }
        return this.instance
    }
}