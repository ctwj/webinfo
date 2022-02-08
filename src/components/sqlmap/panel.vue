<template>
    <div v-loading="loading" class="sqlmap-container">
        <el-row :gutter="20" :justify="'space-between'" :align="'middle'" class="header">
            <el-col :span="12">
                <el-input v-model="search.text" size="small" style="width:120px;margin-right: 8px;" placeholder="search">
                    <template #prefix>
                        <BIconSearch style="margin-left: 8px;vertical-align: middle;"/>
                    </template>
                </el-input>
                <el-checkbox v-model="search.showBug" label="只看bug"></el-checkbox>
            </el-col>
            <el-col :span="12">
                <el-space style="float: right;">
                    <el-button @click="deleteSafe">
                        <BIconDashCircleFill style="margin-right: 8px;vertical-align: middle;" />Remove Nobug
                    </el-button>
                    <el-button @click="reloadTable">Refresh</el-button>
                </el-space>
            </el-col>
        </el-row>
        <el-table 
            :height="'inherit'" 
            :data="tableData.list" 
            :row-class-name="tableRowClassName"
            class="table" 
            style="width: 100%"
            @selection-change="handleSelectionChange">
            <el-table-column type="selection"  width="55"/>
            <el-table-column prop="hostname" label="Hostname">
                <template #default="scope">
                    <span :title="scope.row.url">
                        {{ scope.row.hostname ?? '获取中' }}
                    </span>
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
                        @click.stop="() => handleStart(scope.row)" />
                </template>
            </el-table-column>
            <el-table-column prop="inject" label="Bug" width="80">
                <template #default="scope">
                    {{ scope.row.inject ? '是' : '' }}
                </template> 
            </el-table-column>
            <el-table-column prop="opr" label="Operate" width="200">
                <template #default="scope">
                    <el-button
                        v-if="scope.row.inject"
                        size="small"
                        @click="handleDetail(scope.$index, scope.row)"
                        >Detail</el-button
                    >

                    <el-button
                        v-if="!scope.row.inject"
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
            <template v-slot:empty>
                <el-alert v-if="!isEnable" :title="'请先启用 sqlmap 功能！'" type="warning" :closable="false">
                    sqlmap功能没有启用， 点击 <el-button type="text" @click="toOptions">前去开启</el-button>
                </el-alert>
                <el-alert v-if="isEnable && !isConfig" :title="'请先配置 sqlmap api 地址！'" type="warning" :closable="false">
                    sqlmapapi 尚未配置，点击 <el-button type="text" @click="toOptions">前去配置</el-button>
                </el-alert>
                <el-alert v-if="isEnable && isConfig && errorInfo.error" :title="errorInfo.msg" type="error" :closable="false">
                    请确定配置的 sqlmap api 地址是否有效， 点击 <el-button type="text" @click="toOptions">修改配置</el-button>
                </el-alert>
                <el-alert v-if="isEnable && isConfig && !errorInfo.error" title="暂无数据" type="info" :closable="false">
                    前去 Google 进行搜索，slqmap将自动对搜索结果进行扫描
                </el-alert>
            </template>
        </el-table>
        <el-row :gutter="20" class="footer">
            <el-col :span="24">
                <!-- <el-pagination layout="prev, pager, next" :total="50"></el-pagination> -->
            </el-col>
        </el-row>
        <el-dialog
            v-model="logVisable"
            title="Detail"
            width="600px"
        >
            <div style="max-height: 320px;overflow-y: auto;">
                <el-timeline>
                    <el-timeline-item v-for="item in logData.list" :key="item" center :timestamp="item.time" placement="top">
                        <span :class="{
                            'warning-text': item.level === 'WARNING',
                            'critical-text': item.level === 'CRITICAL',
                        }">{{ item.message }}</span>
                    </el-timeline-item>
                </el-timeline>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="logVisable = false">Close</el-button>
                </span>
            </template>
        </el-dialog>
        <el-dialog
            v-model="detailVisable"
            title="Log"
            width="600px"
        >
            <div style="max-height: 320px;overflow-y: auto;">
                <pre>{{ detailData }}</pre>
            </div>
            <template #footer>
                <span class="dialog-footer">
                    <el-button @click="detailVisable = false">Close</el-button>
                </span>
            </template>
        </el-dialog>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { BIconSearch, BIconDashCircleFill, BIconCaretRightSquare } from 'bootstrap-icons-vue';

import { MSG, TASK_STATUS, CommandReply, PORT_NAME, TableRecord } from './const';
import { ErrorCode, getErrorByCode } from '../type';
import { SqlmapComponent } from './sqlmap';

interface LogData  {
    time:string;
    level:string;
    message:string;
}

export default  defineComponent({
    name: 'SqlmapPanel',
    components: {
        BIconSearch, BIconDashCircleFill, BIconCaretRightSquare
    },
    setup: () => {

        let port:chrome.runtime.Port;
        // const optionsUrl = chrome.runtime.getURL('options/index.html');
        const STATUS = {
            FINISH: TASK_STATUS.FINISH,
            RUNNING: TASK_STATUS.RUNNING,
            NOT_RUNNING: TASK_STATUS.NOT_RUNNING,
        };
        const errorInfo=reactive({
            error: false,
            code: '',
            msg: '',
        });
        const search = reactive({
            text: '',
            showBug: false,
        });
        const isEnable = ref(false);
        const isConfig = ref(false);
        const loading = ref(false);
        const logVisable = ref(false);
        const detailVisable = ref(false);
        const tableData = reactive({list: [] as TableRecord[], source: [] as TableRecord[]});
        const logData = reactive({list: [] as LogData[]});
        const detailData = ref('');
        const multipleSelection = ref<TableRecord[]>([])
        const component = new SqlmapComponent();

        // 过滤条件
        watch(search, () => {
            tableData.list = tableData.source.filter(
                record => record.hostname?.includes(search.text)
            ).filter(record => {
                if (search.showBug) {
                    return record.inject;
                }
                return true;
            })
        })

        // 处理 TASK_LIST_REPLY 返回数据
        const taskListReplyHandler = (data: TableRecord[]) => {
            tableData.source = data;
            tableData.list = data;
            loading.value = false;
        };

        // 处理 TASK_LOG_REPLY 返回数据
        const taskLogReplyHandler = (data: LogData[]) => {
            logData.list = data;
            logVisable.value = true;
            loading.value = false;
        };

        // 处理 TASK_LOG_REPLY 返回数据
        const taskDetailReplyHandler = (data: string) => {
            detailData.value = atob(data);
            detailVisable.value = true;
            loading.value = false;
        };

        // 处理 TASK_DELETE_REPLY 返回数据
        const taskDeleteReplyHandler = (data: boolean) => {
            loading.value = false;
            ElMessage({
                message: data ? 'Task Delete Success' : 'Task Delete Fail.',
                type: data ? 'success' : 'error',
            });

            // reload
            data && reloadTable();
        };

        // 处理 TASK_START_REPLY 返回数据
        const taskStartReplyHandler = (data: boolean) => {
            loading.value = false;
            ElMessage({
                message: data ? 'Task Start Success' : 'Task Start Fail.',
                type: data ? 'success' : 'error',
            });

            // reload
            data && reloadTable();
        };

        const reloadTable = () => {
            loading.value = true;
            port.postMessage({command: MSG.TASK_LIST});
        }

        // background 通信
        const msgHandler = (msg:CommandReply) => {
            if (!msg.success) {
                loading.value = false;
                // 显示错误
                errorInfo.error = true;
                errorInfo.code = msg.errorCode ?? '';
                errorInfo.msg = getErrorByCode(msg.errorCode as ErrorCode);
                console.log(errorInfo);
                return;
            }

            switch (msg.command) {
                case MSG.TASK_LIST_REPLY:
                    taskListReplyHandler(msg.data);
                    break;
                case MSG.TASK_LOG_REPLY:
                    taskLogReplyHandler(msg.data);
                    break;
                case MSG.TASK_DETAIL_REPLY:
                    taskDetailReplyHandler(msg.data);
                    break;
                case MSG.TASK_DELETE_REPLY:
                    taskDeleteReplyHandler(msg.data);
                    break;
                case MSG.TASK_START_REPLY:
                    taskStartReplyHandler(msg.data);
                    break;
                default:
            }
        }

        // mounted
        onMounted( async () => {
            isEnable.value = await component.isEnable();
            isConfig.value = await component.getConfig().get('sqlmapapi');
            if (!isEnable.value || !isConfig.value) {
                console.log(`[e]未开启或者未配置sqlmapapi`);
                return;
            }
            // popup 受跨域限制，所有请求，放到 background 中执行
            port = chrome.runtime.connect({name: PORT_NAME});
            port.onMessage.addListener(msgHandler);
            reloadTable();
        });

        // 处理table选中
        const handleSelectionChange = (val: TableRecord[]) => {
            multipleSelection.value = val;
        }

        // 删除任务
        const handleDelete = (index:number, record:TableRecord) => {
            console.log(`[i]Delete index:${index} item!`);
            if (record.inject) {
                ElMessageBox.confirm(
                    `确定要删除 ${record.hostname} 吗？`, '删除'
                )
                .then(() => {
                    loading.value = true;
                    port.postMessage({command: MSG.TASK_DELETE, taskId: record.taskId});
                });
            } else {
                loading.value = true;
                port.postMessage({command: MSG.TASK_DELETE, taskId: record.taskId});
            }
        }

        // 开始任务
        const handleStart = ( record:TableRecord) => {
            console.log(`[i]Start taskId:${record.taskId} item!`);
            loading.value = true;
            port.postMessage({command: MSG.TASK_START, taskId: record.taskId});
        }

        // 日志
        const handleLog = (index:number, record:TableRecord) => {
            console.log(`[i]Log index:${index} item!`);
            loading.value = true;
            port.postMessage({command: MSG.TASK_LOG, taskId: record.taskId});
        };

        // 详情
        const handleDetail = (index:number, record:TableRecord) => {
            console.log(`[i]Log index:${index} item!`);
            loading.value = true;
            port.postMessage({command: MSG.TASK_DETAIL, taskId: record.taskId, url: record.url});
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

        const tableRowClassName = ({ row, rowIndex, }: { row: TableRecord, rowIndex: number}) => {
            return row.inject ? 'success-row' : '';
        }

        /**
         * 打开选项页面
         */
        const toOptions = () => {
            chrome.runtime.sendMessage({command: MSG.TASK_OPEN_OPTIONS}, function(response) {
                console.log(response);
            });
        }

        /**
         * 删除所有安全的链接
         */
        const deleteSafe = () => {
            ElMessageBox.confirm(
                '确定要删除所有不存在bug的链接吗？', '删除'
            )
            .then(() => {
                loading.value = true;
                port.postMessage({command: MSG.TASK_DELETE, taskIds: tableData.source.filter(record => !record.inject).map(item => item.taskId)});
            });
        }
        
        return {
            STATUS, isEnable, isConfig,
            tableData, logData, detailData, search, errorInfo,
            loading, detailVisable, logVisable, 
            handleSelectionChange, handleDelete, handleLog, handleStart, handleDetail, deleteSafe, reloadTable,
            getStatusText, getTagTypeByStatus,
            tableRowClassName,
            toOptions,
        }
    }
});
</script>

<style>
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

.sqlmap-container  .table {
    flex-grow: 1;
    flex-shrink: 1;
}
.sqlmap-container  .success-row {
    background-color: #f0f9eb;
}
.warning-text {
    color: #E6A23C;
}
.critical-text {
    color: #F56C6C;
}
</style>