import { BaseComponent } from "./component";

import { SqlmapComponent } from './sqlmap/sqlmap';

/**
 * 组件管理器
 */
export class ComponentManager {
    
    private componentList: BaseComponent[] = [];

    constructor () {
        const sqlmap = new SqlmapComponent();
        this.Register(sqlmap);
    }

    /**
     * 组件是否已经注册
     * @param component 
     * @returns 
     */
    private componentExists (component: BaseComponent): boolean {
        return !!this.componentList.find(item => item.name === component.name);
    }

    /**
     * 组件注册
     * @param component 
     * @returns 
     */
    private Register(component: BaseComponent) {
        if (this.componentExists(component)) {
            return;
        }
        this.componentList.push(component);
        console.log(`register componet %c${component.name}: %c${component.desc}`, 'color: green', 'color: yellow');
    }

    /**
     * 运行 content-script 中内容
     */
    public runContentScript() {
        this.componentList.forEach(async component => {
            if (await component.isEnable()) {
                component.content();
            }
        });
        console.log(`[i]content script register finished!`);
    }

    /**
     * 运行 background
     */
    public runBackground() {
        this.componentList.forEach(async component => {
            const enable = await component.isEnable();
            if (await component.isEnable()) {
                component.background();
            }
            
        })
        console.log(`[i]backgournd register finished!`);
    }

}