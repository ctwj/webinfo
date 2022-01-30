import Singleton from "@/utils/singleton";

export class Cache<T> extends Singleton{

    public cacheKey:string = 'ctwj_cache_base';
    private persistence:boolean;
    private map = new Map<string, T>();

    /**
     * 
     * @param cacheKey 缓存key
     * @param persistence 是否持久化缓存
     * @param peroid 自动缓存周期
     */
    constructor ( persistence: boolean = false, peroid: number = 10000) {
        super();
        this.persistence = persistence;
        this.loadCache();
    }

    // 载入缓存
    private loadCache() {
        console.log(this.cacheKey);
    }

    // 获取缓存
    public get(key:string):T|undefined {
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

    // 清除缓存
    public clear (key: string) {
        return this.map.clear
    }

    // 持久化
    public doPersistence() {
        if (!this.persistence) {
            return;
        }
    }
}