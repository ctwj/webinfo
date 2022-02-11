/**
 * 缓存列表,做一个简单的小缓存对象
 * 
 * let cache_list = new CacheList(50);
 * cache_list.add(key, this.ns)
 * cache_list.has(key)
 */

export class CacheList<T> {

    private _lock:boolean;
    private _len:number;
    private _list:string[];
    private _cache:{[key:string]:T[]};

    /**
     * 缓存的长度
     * @param {integer} len 
     */
    constructor(len = 50) {
        //锁
        this._lock = false;
        //长度记数器
        this._len = len;
        //key列表, 保存清除的数据是最旧的
        this._list = [];
        //数据列表
        this._cache = {};
    }

    /**
     *  是否为空
     */
    isEmpty() {
        return this._list.length == 0;
    }

    /**
     * 是否已满
     */
    isFull() {
        return this._len <= this._list.length;
    }

    /**
     * 清除列表
     */
    clean() {
        this._cache = {};
        this._list = [];
    }

    /**
     * 长度
     */
    length() {
        return this._list.length;
    }



    /**
     * 操作是否已经存在
     * @param {stirng} key 
     * @param {string} opreation 
     */
    hasOperation(key:string, operation:string) {
        return this.has(key) && this._cache.hasOwnProperty(operation)
    }

    /**
     * 移除最后的数据 , 默认一次移除5个
     */
    removeLast(num = 5) {
        if (this._len <= num) {
            this.clean;
        }
        for (let i = 0; i < num; i++) {
            let k = this._list.shift();
            delete this._cache[k as string];
        }
    }

    /**
     * 添加记录
     * @param {string} key 
     * @param {T} value 
     */
    add(key:string, value:T) {
        //如果列表已经满了,清除一些数据
        if (this.isFull()) {
            this.removeLast();
        }

        if (this.has(key)) {
            //增加属性
            this._cache['key'].push(value);
        } else {
            //新增元素
            this._list.push(key);
            this._cache['key'] = [value];
        }
    }

    /**
     * key是否存在
     * @param {string} key 
     */
    has(key:string) {
        return this._list.indexOf(key) >= 0;
    }

}

export default CacheList;