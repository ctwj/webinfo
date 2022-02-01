import { TableRecord } from "@/components/sqlmap/const";
// import Singleton from "@/utils/singleton";

/**
 * 定时持久化的缓存， 只在 background 运行
 */
export class Cache<T>{

    private static _instance: any;

    static getInstance() {
        return this._instance;
    }

    public cacheKey:string = 'ctwj_cache_base';
    private peroid:number;
    private persistence:boolean;
    private map: Map<string, T> = new Map();

    public getMap() {
        return this.map;
    }

    /**
     * 
     * @param cacheKey 缓存key
     * @param persistence 是否持久化缓存
     * @param peroid 自动缓存周期
     */
    constructor(persistence: boolean = false, peroid: number = 60000) {
        if (!Cache._instance) {
            Cache._instance = this;
        }
        this.persistence = persistence;
        this.peroid = peroid;
        this.loadCache();
        return Cache._instance;
    }

    // 载入缓存
    private loadCache() {
        if (!this.persistence) {
            return;
        }
        new Promise((resolve, reject) => {
            chrome.storage.local.get([this.cacheKey], (items) => {
                if (items[this.cacheKey] === undefined) {
                    this.map = new Map<string, T>();
                    chrome.storage.local.set({ [this.cacheKey]: this.map })
                } else {
                    this.map = items[this.cacheKey];
                }
                resolve(this.map);
            });
        }).then(() => {
            // 载入完成之后， 开始定时持久化
            setInterval(this.doPersistence, this.peroid)
        });
    }

    // 获取缓存
    public get (key:string):T|undefined {
        return this.map.get(key);
    }

    public set (key: string, data: T) {
        // 持久化
        return this.map.set(key, data);
    }

    // 是否需要更新
    public needChange(key: string, n:T, cb: (n:T, old:T)=>boolean) {
        return cb(n, this.get(key) as T);
    }

    // 缓存是否存在
    public isExists (key: string) {
        return this.map.has(key);
    }

    // 固定字段是否重复
    public isFieldExists (field: string, value: string) {
        return [...this.map.keys()].findIndex(key => (this.map.get(key)as any)?.[field] === value) > -1;
    }

    // 清除缓存
    public clear (key: string) {
        return this.map.clear
    }

    // 持久化
    public doPersistence() {
        if (!this.persistence) {
            return;
        }
        // TODO
        // let data:{key:string, value: T}[] = [];
        // for (let key in  this.map.keys()) {
        //     data.push({key, value: this.map.get(key) as T});
        // }
        chrome.storage.local.set({[this.cacheKey]: this.map});
    }
}