<template>
    <div class="component container">
        <h1 class="component-title">
        Webinfo --  <span class="subtitle">网站信息查看插件</span>
        </h1>
        <el-card 
            v-for="component in componentData" 
            :Key="component"
            class="mb-4">
            <template #header>
                <div class="card-header">
                    <div>
                        <h3>{{ component.name }}</h3>
                        {{ component.desc }}
                    </div>
                    <div v-if="component.canDisable" style="display: inline-block">
                        <el-switch v-model="component.enable" @change="val => disableComponent(component, val)" />
                        {{ component.enable ? '已启用' : '已禁用' }}
                    </div>
                </div>
            </template>
            <div class="configs">
                <div class="lock"></div>
                <el-form
                    :label-position="'left'"
                >
                    <template v-for="config in component.configs" :key="config.name">
                        <el-form-item :label="config.title">
                            <el-input v-if="config.type === TYPES.INPUT" v-model="config.value" @blur="changeConfig(config.name, component)"></el-input>
                            <el-select v-if="config.type === TYPES.SELECT" v-model="config.value">
                                <el-option
                                    v-for="item in config.options"
                                    :key="item.value"
                                    :label="item.label"
                                    :value="item.value"
                                    >
                                </el-option>
                            </el-select>
                        </el-form-item>
                        <span style="color: darkgray;display:inline-block;margin-bottom:24px;">{{ config.description }}</span>
                    </template>
                </el-form>
            </div>
            <!-- {{ component.configs }} -->
        </el-card>
    </div>
</template>

<script lang="ts">

/**
 * 配置页面
 */

import { defineComponent, reactive, onMounted } from "vue";

import { ElMessage } from 'element-plus'

import { ComponentManager } from "@/components/manager";
import { BaseComponent } from "@/components/component";
import { ConfigItem, ConfigType } from "@/components/type";

interface ComponentData {
    locked: boolean;    // 锁定， 解锁后， 可以修改
    canDisable: boolean;// 是否可以禁用
    enable: boolean;    // 组件是否启用
    name: string;       // 组件名字
    desc: string;       // 组件描述
    configs: ConfigItem[];      // 组件配置项
    component: BaseComponent;   // 组件对象
}

export default defineComponent({
    name: "App",
    setup: () => {
        const manager = new ComponentManager();
        let componentList:ComponentData[] = [];

        const componentData = reactive([] as ComponentData[]);

        const TYPES = {
            INPUT: ConfigType.INPUT,
            SELECT: ConfigType.SELECT,
        }

        onMounted(async () => {
            console.log('onMounted');

            const components = manager.getComponents();
            console.log('components',components);
            components.forEach(async component => {
                componentData.push({
                    locked: true,
                    canDisable: component.canDisable,
                    enable: await component.isEnable(),
                    name: component.name,
                    desc: component.desc,
                    configs: await component.getConfig().getConfigs(),
                    component,
                });
            });

            // TODO 需要优化， 当前为了现实默认值，切换一下开关才显示
            setTimeout(() => {componentData[0].enable = !componentData[0].enable}, 100);
            setTimeout(() => {componentData[0].enable = !componentData[0].enable}, 400);
            
        });

        const disableComponent = (component:ComponentData, val:boolean) => {
            console.log('disable component', component.configs);
            component.component.setSwitch(val);
        }

        // 修改配置
        const changeConfig = (name:string, component:ComponentData) => {
            const value = component.configs.find(item => item.name === name)?.value ?? '';
            component.component.config.set(name, value);
            ElMessage({
                message: 'Congrats, 配置更新成功.',
                type: 'success',
            });
        }

        return {
            TYPES,
            componentData, 
            disableComponent,
            changeConfig,
        }
    }
    
})
</script>