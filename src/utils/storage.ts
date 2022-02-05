
export class Storeage {
    static set (items: { [key: string]: any }): Promise<void>{
        return chrome.storage.local.set(items);
    }

    static get (key: string): Promise<any> {
        return new Promise((resolve,reject) => {
            chrome.storage.local.get([key], (items) => {
                resolve(items[key]);
            })
        });
        
    }
}