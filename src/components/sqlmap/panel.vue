<template>
    <div :v-loading="loading" class="sqlmap-container">
        <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="date" label="Date" width="180" />
            <el-table-column prop="name" label="Name" width="180" />
            <el-table-column prop="address" label="Address" />
        </el-table>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, reactive, onMounted } from 'vue'

import SqlmapPanel from '@/components/sqlmap/panel.vue';

import { MSG, Command, PORT_NAME } from './const';

export default  defineComponent({
    name: 'SqlmapPanel',
    setup: () => {

        let port;
        const loading = ref(false);
        const tableData = reactive([
        {
            date: '2016-05-03',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
        },
        {
            date: '2016-05-02',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
        },
        {
            date: '2016-05-04',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
        },
        {
            date: '2016-05-01',
            name: 'Tom',
            address: 'No. 189, Grove St, Los Angeles',
        },
        ]);

        const msgHandler = (msg:any) => {
            console.log('get msg from port', msg);
        }
        onMounted( () => {
            window.console.log('mounted');
            loading.value = true;

            // popup 受跨域限制，所有请求，放到 background 中执行
            port = chrome.runtime.connect({name: PORT_NAME});
            port.postMessage({command: MSG.TASK_LIST});
            port.onMessage.addListener(msgHandler);
        });
        
        return {
          tableData,
          loading,
        }
    }
});
</script>

<style scoped>
.sqlmap-container {
}
</style>