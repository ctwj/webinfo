import { createApp } from 'vue'
import App from './App.vue'

import ElementPlus from "element-plus";

// options page 标记
(window as any).__proto__.isOptions = 1;

createApp(App).use(ElementPlus).mount('#app')