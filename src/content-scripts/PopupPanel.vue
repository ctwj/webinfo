<template>
    <div class="panel-container">
      <el-tabs v-model="activeName" @tab-click="handleClick">
        <el-tab-pane label="User" name="first">
          <sqlmap-panel />
        </el-tab-pane>
        <el-tab-pane label="Config" name="second">Config</el-tab-pane>
      </el-tabs>
    </div>
</template>

<script lang="ts">
import { ref, defineComponent, Prop } from 'vue'
import { ElMessageBox } from 'element-plus'

import SqlmapPanel from '@/components/sqlmap/panel.vue';

export default  defineComponent({
    name: 'PopupPanel',
    components: {
      SqlmapPanel
    },
    setup: () => {
        
        const handleClick = (tab: string, event: Event) => {
          console.log(tab, event)
        }
        let activeName = ref('first');
        return {
          handleClick,
          activeName,
        }
    }
});
</script>

<style scoped>
.panel-container {
    width: 760px;
}
</style>