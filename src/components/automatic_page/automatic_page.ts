import { BaseComponent } from "@/components/component";
import { ComponnetConfig } from "@/components/config";
import { Storeage } from "@/utils/storage";
import { threadId } from "worker_threads";
import { PARENT_MENU_ID } from "../type";

enum ChangeStatus {
    Stop = 'stop',
    Changing = 'changing',
}

const ACTION_NEXT_PAGE = 'start-automatic-next-page';
const MENU_ID = 'automatic-next-page-menu';

export class AutomaticPageComponent extends BaseComponent {

    // component public
    public name = "automatic_page";
    public desc = "搜索引擎自动翻页";

    // 翻页时间， 翻页6秒后，如果没有继续翻页，翻页状态设置为停止状态
    private changeTime: number | null = null;
    private status:ChangeStatus = ChangeStatus.Stop; 


    /**
     * 
     */
    constructor () {
        super();
    }

    private getStorageKey(type:string) {
        return `${this.name}-${type}`;
    }

    public background(): void {
        this.setStatusNow(this.status);

        // http://www.dre.vanderbilt.edu/~schmidt/android/android-4.0/external/chromium/chrome/common/extensions/docs/match_patterns.html
        chrome.contextMenus.create(
            {
                id: MENU_ID,
                parentId: PARENT_MENU_ID,
                title: '开始自动翻页',
                contexts: ['page'],
                documentUrlPatterns: ['<all_urls>'],
            }
        );
        chrome.contextMenus.onClicked.addListener(
            event => {
                this.setStatusNow(ChangeStatus.Changing);

                // 修改菜单为，停止自动翻页
                // chrome.contextMenus.update(MENU_ID, {title: '停止自动翻页'});
                
                // 通知当前页面翻页
                chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
                    const tab = tabs[0];
                    chrome.tabs.sendMessage(
                        tab.id as number, 
                        {action: ACTION_NEXT_PAGE}, 
                        function(response) {}
                    );  
                })
            }
        )
    }

    private nextPage() {
        console.log('next page happen!');
    }

    private setStatusNow(status: ChangeStatus) {
        chrome.storage.local.set({[this.getStorageKey('changeTime')]: new Date().getTime()});
        chrome.storage.local.set({[this.getStorageKey('changeStatus')]: status});
    }

    /**
     * 注入在 content-script 中代码
     * 自动翻页
     */
    public async content () {

        chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
            if (msg?.action === ACTION_NEXT_PAGE ) {
                this.nextPage();
                sendResponse('ok');
            }
        });

        const status = await Storeage.get(this.getStorageKey('changeTime'));
        const changeTime = await Storeage.get(this.getStorageKey('changeStatus'));
        const now = new Date().getTime();

        // 状态为翻页中，并且未超过10秒
        if (status === ChangeStatus.Changing && changeTime !== null 
            && now - changeTime < 10000) {
            this.nextPage();
            return;
        }
        
    }

}