/**
 * task, 任务管理
 * 注册消费函数之后， 任何添加到task中的任务， 都会自动消费
 */

import { BaseComponent } from "@/components/component";

export default class Task<T> {
    // 任务列表
    private tasks = { tasks: [] as T[]};

    // 任务消费中
    private running = false;

    // 拥有 Task 的组件， productHandler 中有用到
    private component: BaseComponent;

    /**
     * 任务消费函数
     */ 
    private productHandler: ((task: T, next: () => void, component: BaseComponent) => void);
    

    /**
     * 构造函数
     * 在注册的handle中， 需要调用 next 函数， 进一步处理
     */
    constructor(handler: (task: T, next: () => void, component: BaseComponent) => void, component: BaseComponent) {
        this.component = component;
        this.productHandler = (task:T) => {
            handler(task, this.next(this), component);
        };
    }

    /**
     * 添加一个任务
     * @param product 
     */
    public add(product: T) {
        this.tasks.tasks.push(product);
        if (!this.running && this.tasks.tasks.length) { // 列表非空， 开始消费
            console.log('[i]Task: start!');
            this.running = true;

            // 延迟一点再开始处理任务
            setTimeout(() => {
                this.consumer()
            }, 1000);
        }
    }

    /**
     * 开始消费
     */
    public consumer() {
        if (!this.tasks.tasks.length) { // 列表为空， 停止消费
            this.running = false;
            console.log('[i]Task:all finished!')
            return;
        }

        const task = this.tasks.tasks.pop();
        this.productHandler(task as T, this.next(this), this.component);
    }

    /**
     * 处理下一个任务
     */
    private next(that: Task<T>) {
        return () => {
            that.consumer();
        }
    }
}