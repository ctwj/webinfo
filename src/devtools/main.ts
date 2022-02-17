import { ResponseModifyComponent } from '@/components/response_modify/response_modify';
import { createApp } from 'vue'
import App from './App.vue'

// dev page 标记
(window as any).__proto__.isDev = 1;

createApp(App).mount('#app');

ResponseModifyComponent.devtools();