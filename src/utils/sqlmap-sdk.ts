
interface SqlmapTestParmater {
    
}

class SqlmapSDK {
    private token = '';
    private api = '';

    constructor (api:string, token:string) {
        this.token = token;
        this.api = api;
    }

    /**
     * 创建一个测试
     * @param url
     * @param options
     */
    public createTest(url: string, options: SqlmapTestParmater) {

    }
}