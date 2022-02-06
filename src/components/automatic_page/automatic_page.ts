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
const CLICK_DELAY = 3000;

export class AutomaticPageComponent extends BaseComponent {

    // component public
    public name = "automatic_page";
    public desc = "Google搜索引擎自动翻页, 右键菜单开始自动翻页， 只对google生效";
    public canDisable = false;

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
        const nextBtn = document.querySelector('#pnnext');
        this.setStatusNow(!nextBtn ? ChangeStatus.Stop : ChangeStatus.Changing);
        if (nextBtn) {

            // 存在下一页，3秒后翻页
            setTimeout( () => (nextBtn as HTMLElement).click(), CLICK_DELAY);
        } 
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

        const changeTime = await Storeage.get(this.getStorageKey('changeTime'));
        const status = await Storeage.get(this.getStorageKey('changeStatus'));
        const now = new Date().getTime();

        // 状态为翻页中，并且未超过10秒
        if (status === ChangeStatus.Changing && changeTime !== null 
            && now - changeTime < 10000) {
            this.nextPage();
            return;
        } else {
            this.setStatusNow(ChangeStatus.Stop);
        }
        
    }

}