import { Cache } from "@/utils/cache";
import { TableRecord } from "./const";

class SqlmapCache extends Cache<TableRecord> {
    public cacheKey: string = 'ctwj_cache_sqlmap';
}