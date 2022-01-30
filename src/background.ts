import { ComponentManager } from "@/components/manager";

const manager = new ComponentManager();
manager.runBackground();

// action 的 点击事件, 点击图标，弹出面板
chrome.action.onClicked.addListener(tab => {
    if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { toggleVisible: true });
    }
});

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