import { ComponentManager } from "@/components/manager";
import { Command, MSG } from "@/components/sqlmap/const";

const PARENT_MENU_ID = 'webinfo-menu';

// 注册根菜单
chrome.contextMenus.create(
    {
        id: PARENT_MENU_ID,
        title: 'webinfo',
        contexts: ['page'],
        documentUrlPatterns: ['<all_urls>'],
    },

);

// action 的 点击事件, 点击图标，弹出面板
chrome.action.onClicked.addListener(tab => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { toggleVisible: true });
    }
});

// 监听 打开options页面
chrome.runtime.onMessage.addListener((message: Command, sender, sendResponse) => {
    if (message?.command === MSG.TASK_OPEN_OPTIONS) {
        chrome.runtime.openOptionsPage();
    }
})

// 发现是 google 页面并存在搜索结果列表
// var searchRule = {
//     conditions: [
//         new chrome.declarativeContent.PageStateMatcher({
//             pageUrl: { hostContains: 'www.google.', schemes: ['https'] },
//             css: ["div.g.tF2Cxc"]
//         })
//     ],
//     actions: [
//         new chrome.declarativeContent.ShowAction()
//     ]
// }

// chrome.runtime.onInstalled.addListener(function(details) {
//     console.log('oninstall');
//     chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
//         chrome.declarativeContent.onPageChanged.addRules([searchRule]);
//     });
// });

const manager = new ComponentManager();
manager.runBackground();