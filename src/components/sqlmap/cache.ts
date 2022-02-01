import { Cache } from "@/utils/cache";
import { TableRecord } from "./const";

export default class SqlmapCache extends Cache<TableRecord> {
    public cacheKey: string = 'ctwj_cache_sqlmap';

    public print() {
        
        console.log(`cache print, items: ${[...this.getMap().keys()].length}`);
        
        [...this.getMap().keys()].forEach(key => {
            console.log(`key: ${key}, result: `, this.getMap().get(key));
        });
    }

}