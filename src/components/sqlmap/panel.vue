<template>
    <div v-loading="loading" class="sqlmap-container">
        <el-row :gutter="20" :justify="'space-between'" :align="'middle'" class="header">
            <el-col :span="12">
                <el-input v-model="search" class="w-50 m-2" placeholder="Type something">
                    <template #prefix>
                        <BIconSearch style="margin-left: 8px;vertical-align: middle;"/>
                    </template>
                </el-input>
            </el-col>
            <el-col :span="12">
                <el-space style="float: right;">
                    <el-button>
                    <BIconDashCircleFill style="margin-right: 8px;vertical-align: middle;" />Remove Safe
                    </el-button>
                    <el-button type="danger">
                        <BIconDashCircleFill style="margin-right: 8px;vertical-align: middle;" />Remove Selection
                    </el-button>
                </el-space>
            </el-col>
        </el-row>
        <el-table 
            :height="'inherit'" 
            :data="tableData.list" 
            class="table" 
            style="width: 100%"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection" width="55" />
            <el-table-column prop="hostname" label="Hostname">
                <template #default="scope">
                    {{ scope.row.hostname ?? '获取中' }}
                </template>
            </el-table-column>
            <el-table-column prop="status" label="Stauts" width="100">
                <template #default="scope">
                    <el-tag
                        size="small"
                        :type="getTagTypeByStatus(scope.row.status)">
                        {{ getStatusText(scope.row.status) }}
                    </el-tag>
                    <BIconCaretRightSquare 
                        v-if="scope.row.status === STATUS.NOT_RUNNING"
                        style="font-size: 16px; margin-left: 8px; vertical-align: middle;"
                        @click.stop="() => handleStart(scope.row.taskId)" />
                </template>
            </el-table-column>
            <el-table-column prop="inject" label="inject" width="120">
                <template #default="scope">
                    {{ scope.row.inject ?? '' }}
                </template> 
            </el-table-column>
            <el-table-column prop="opr" label="Operate" width="160">
                <template #default="scope">
                    <el-button
                        size="small"
                        @click="handleLog(scope.$index, scope.row)"
                        >Log</el-button
                    >
                    <el-button
                        size="small"
                        type="danger"
                        @click="handleDelete(scope.$index, scope.row)"
                        >Delete</el-button
                    >
                </template>
                </el-table-column>
        </el-table>
        <el-row :gutter="20" class="footer">
            <el-col :span="24">
                <!-- <el-pagination layout="prev, pager, next" :total="50"></el-pagination> -->
            </el-col>
        </el-row>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, reactive, onMounted } from 'vue'
import { MSG, TASK_STATUS, CommandReply, PORT_NAME, TableRecord } from './const';

import { BIconSearch, BIconDashCircleFill, BIconCaretRightSquare } from 'bootstrap-icons-vue';



export default  defineComponent({
    name: 'SqlmapPanel',
    components: {
        BIconSearch, BIconDashCircleFill, BIconCaretRightSquare
    },
    setup: () => {

        let port;
        const STATUS = {
            FINISH: TASK_STATUS.FINISH,
            RUNNING: TASK_STATUS.RUNNING,
            NOT_RUNNING: TASK_STATUS.NOT_RUNNING,
        };
        const search = ref('');
        const loading = ref(false);
        const tableData = reactive({list: [] as TableRecord[]});
        const multipleSelection = ref<TableRecord[]>([])

        // 处理 TASK_LIST_REPLY 返回数据
        const taskListReplyHandler = (data: {[key:string]: string}) => {
            let result = [];
            for (let key in data) {
                result.push({
                    taskId: key,
                    status: data[key] as TASK_STATUS,
                })
            }
            tableData.list = result;
            loading.value = false;
        };

        // background 通信
        const msgHandler = (msg:CommandReply) => {
            if (!msg.success) {
                return;
            }

            switch (msg.command) {
                case MSG.TASK_LIST_REPLY:
                    taskListReplyHandler(msg.data);
                    break;
                default:
            }
        }

        // mounted
        onMounted( () => {
            loading.value = true;

            // popup 受跨域限制，所有请求，放到 background 中执行
            port = chrome.runtime.connect({name: PORT_NAME});
            port.postMessage({command: MSG.TASK_LIST});
            port.onMessage.addListener(msgHandler);
        });

        // 处理table选中
        const handleSelectionChange = (val: TableRecord[]) => {
            multipleSelection.value = val;
        }

        // 删除任务
        const handleDelete = (index:number, record:TableRecord) => {
            console.log(`[i]Delete index:${index} item!`);
            console.log(record);
        }

        // 开始任务
        const handleStart = (taskId: string) => {
            console.log(`[i]Start taskId:${taskId} item!`);
            console.log(taskId);
        }

        // 日志
        const handleLog = (index:number, record:TableRecord) => {
            console.log(`[i]Log index:${index} item!`);
            console.log(record);
        };

        // 获取状态文案
        const getStatusText = (status: TASK_STATUS) => {
            const map:Record<TASK_STATUS, string> = {
                [TASK_STATUS.FINISH]: '已完成',
                [TASK_STATUS.RUNNING]: '检测中',
                [TASK_STATUS.NOT_RUNNING]: '未开始',
            }
            return map[status];
        };

        const getTagTypeByStatus = (status: TASK_STATUS) => {
            const map:Record<TASK_STATUS, string> = {
                [TASK_STATUS.FINISH]: 'success',
                [TASK_STATUS.RUNNING]: '',
                [TASK_STATUS.NOT_RUNNING]: 'info',
            }
            return map[status];
        };
        
        return {
            STATUS,
            tableData, loading, search,
            handleSelectionChange, handleDelete, handleLog, handleStart,
            getStatusText, getTagTypeByStatus,
        }
    }
});
</script>

<style scoped>
.sqlmap-container {
    height: calc(100vh - 164px);
    display: flex;
    flex-direction: column;
}
/* .header,
.footer {
    flex-grow: 0;
    flex-shrink: 0;
} */

.table {
    flex-grow: 1;
    flex-shrink: 1;
}
</style>