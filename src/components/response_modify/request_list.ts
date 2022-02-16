import CacheList from "@/utils/cache_list";


interface RequestData {
    url: string;
    method: 'POST' | 'GET' | 'PUT' | 'DELETE';
    header: any[];
    data: string | Object;
    responseText: string;
    key: string;
}


/**
 * 请求缓存列表
 * 获得的API，存入缓存列表中
 */
class RequestList {
    private limit = 1000;

    private cache:CacheList<RequestData> | null = null;

    constructor (limit:number = 1000) {
        this.limit = limit;
        this.cache = new CacheList<RequestData>(limit);
    }
}