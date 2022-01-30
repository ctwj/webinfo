import { createApp } from "vue";
import ElementPlus from "element-plus";
import Popup from "./Popup.vue";
import "element-plus/lib/theme-chalk/index.css";

import { ComponentManager } from "../components/manager";

const MOUNT_EL_ID = "webinfo-ctwj-wrapper";

// 页面中输入 窗口
let mountEl = document.getElementById(MOUNT_EL_ID);
if (mountEl) {
    mountEl.innerHTML = "";
}
mountEl = document.createElement("div");
mountEl.setAttribute("id", MOUNT_EL_ID);
document.body.appendChild(mountEl);
const vm = createApp(Popup).use(ElementPlus).mount(mountEl);

/**
 * 事件监听
 */
chrome.runtime.onMessage.addListener((message) => {
    if (message.toggleVisible) {
        (vm as any).visible = !(vm as any).visible;
    }
});

/**
 * 运行组件中 content script 代码
 */
const manager = new ComponentManager();
manager.runContentScript();
