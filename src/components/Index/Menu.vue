<template>
    <div class="menu-drawer">
        <div v-if="menu_mode.step == 'start'">
            <h3>主菜单</h3>

            <p class="menu-content none-indent">注：该区域模块尚未全部完善，近期仅用于测试。</p>
            <p class="menu-content none-indent">帝国金币：{{ store.country_money }}</p>
            <p class="menu-content none-indent">紧缚币：{{ store.bondage_money }}</p>
            <p class="menu-content none-indent">背包容量：{{ store.bag.bag_occupancy }}/{{ store.bag.max_bag_capacity }}&ensp;<LiButton @click="menu_mode.step = 'bag'">背包/装备</LiButton></p>

            <p class="menu-content none-indent">璃落属性：&ensp;<LiButton @click="menu_mode.step = 'role'">详细</LiButton></p>
            <Role :mode="'sample'" />
            <p class="menu-content none-indent">探险载具：&ensp;<LiButton v-if="store.field_liluo.car.ownership" @click="menu_mode.step = 'car'">详细</LiButton></p>
            <Car :mode="'sample'" />

            <br>

            <div v-if="!store.game_step.field">
                <LiButton class="default-button" @click="menu_mode.step = 'save'">存档</LiButton><br>
                <LiButton class="default-button" @click="menu_mode.step = 'load'">读档</LiButton><br>
            </div>
            <div v-else>
                <p class="menu-content none-indent">注：当前位于野外，因此无法存档/读档，功能在回到缚神领地后开启。</p>
            </div>
        </div>

        <!-- 背包 -->
        <Bag v-if="menu_mode.step == 'bag'" />
        <!-- 人物 -->
        <Role :mode="'detail'" v-if="menu_mode.step == 'role'"/>
        <!-- 车辆 -->
        <Car :mode="'detail'" v-if="menu_mode.step == 'car'" />

        <!-- 存档 -->
        <div v-if="menu_mode.step == 'save'">
            <h3>存档</h3>
            <p class="menu-content">当前提供两种存档保存方法：保存到浏览器和复制到剪切板</p>
            <p class="menu-content">保存到浏览器可以将存档数据存入浏览器内的数据库中，但删除浏览器或更换设备时可能导致存档丢失！</p>
            <p class="menu-content">复制到剪切板可以将存档数据复制到剪切板中，由用户自行保存存档数据，注意不要更改存档数据，否则可能会导致游戏崩溃等问题。</p>
            <p class="menu-content">当前存档内容：</p>
            <div class="game-content">
                <p>{{ store.$state }}</p>
            </div>
            <br>
            <LiButton class="default-button" @click="store.saveLocalStage(); 
                proxy._.appContext.config.globalProperties.$message.info('存档已保存到浏览器！');">保存到浏览器
            </LiButton><br>
            <LiButton class="default-button" @click="store.stringifyStage();
                proxy._.appContext.config.globalProperties.$message.info('存档已复制到剪切板！');">复制到剪切板
            </LiButton><br>
            <LiButton class="default-button danger-button" @click="pending_clear_local_stage = true">清空浏览器中的存档</LiButton><br>
            <div v-if="pending_clear_local_stage" class="confirm-box">
                <p class="menu-content none-indent">确认要清空浏览器中的本机存档吗？删除后无法从浏览器本机恢复。</p>
                <LiButton class="default-button danger-button" @click="clickClearLocalStage">确认清空</LiButton>
                <LiButton class="default-button" @click="pending_clear_local_stage = false">先保留</LiButton>
            </div>
        </div>
        <!-- 读档 -->
        <div v-if="menu_mode.step == 'load'">
            <h3>读档</h3>
            <p class="menu-content">目前提供两种读档方式：使用浏览器存档或将用户自行保存的存档复制到存档框中。</p>
            <p class="menu-content">当前待读取存档内容：</p>
            <textarea class="game-content" v-model="load_data">
            </textarea>
            <br><br>
            <LiButton class="default-button" @click="load_data = store.loadLocalStage();
                proxy._.appContext.config.globalProperties.$message.info('浏览器存档已展示到输入框！');">调用使用浏览器存档
            </LiButton><br>
            <LiButton class="default-button" @click="load_data = '';
                proxy._.appContext.config.globalProperties.$message.info('已清空输入框，请将自储存存档复制到输入框！');">调用用户自储存存档
            </LiButton><br><br>
            <LiButton class="default-button" @click="clickLoad">确认使用该存档</LiButton><br>
        </div>

        <br><br>
        <LiButton class="default-button" v-if="menu_mode.step != 'start' && menu_mode.return_button" @click="menu_mode.step = 'start'">主游戏菜单</LiButton><br>
    </div>
</template>

<script>
import LiButton from '../base/LiButton.vue'
import Bag from './Menu/Bag.vue'
import Role from './Menu/Role.vue'
import Car from './Menu/Car.vue'
import { useUsersStore } from '@/store/store'
import { car_shop } from '../Empire/TrialsCity/Shop'
export default {
    components: {
        LiButton,
        Role,
        Car,
        Bag,
    },
    setup() {

        let proxy = ref(null)
        onMounted(() => {
            proxy.value = getCurrentInstance().proxy // 代替this时用到，用于arco的message功能
        })

        const store = useUsersStore()
        const menu_mode = ref(store.game_step.game_menu.main)

        const load_data = ref()
        const pending_clear_local_stage = ref(false)
        const clickClearLocalStage = () => {
            const clearedCount = store.clearLocalStage()
            pending_clear_local_stage.value = false
            proxy.value._.appContext.config.globalProperties.$message.info(
                clearedCount > 0 ? `已清空 ${clearedCount} 项浏览器存档！` : '当前没有可清空的浏览器存档。'
            )
        }
        const clickLoad = () => {
            const load = JSON.parse(load_data.value)
            const loadData = (obj1, obj2) => { // 为了保证类内函数的完整，需要递归将所有属性数据读取进store中，而不能直接改变类的指针。
                for(let item in obj2){
                    if(Object.prototype.toString.call(obj2[item]) === '[object Object]'){ // 对纯对象，继续向内递归
                        loadData(obj1[item], obj2[item])
                    }
                    else { // 其他的，进行赋值
                        obj1[item] = obj2[item]
                    }
                }
            }
            loadData(store, load) // 将数据读取入游戏
            store.parseStage() // 格式化读档
            store.game_step.game_menu.main.step = 'start' // 读档后将menu的页面跳转到主页
            proxy.value._.appContext.config.globalProperties.$message.info('已加载当前输入框中的存档！')
            // console.log(store.$state)
        }

        return {
            proxy, store, car_shop,
            menu_mode,
            load_data, clickLoad,
            pending_clear_local_stage, clickClearLocalStage,
        }
    },
}
</script>

<style scoped>
    .menu-drawer {
        text-align: center;
    }
    .none-indent {
        text-indent: 0em;
    }
    .one-indent {
        text-indent: 1em;
    }
    .game-content {
        width: 100%;
        height: 130px;
        overflow: auto;
        border: 3px solid pink;
        border-radius: 5px;
    }
    .confirm-box {
        margin: 12px auto;
        padding: 10px;
        border: 2px solid #f19ab1;
        border-radius: 5px;
        background: rgba(255, 232, 239, 0.75);
    }
    .danger-button {
        border-color: #e56b89;
        color: #8d1837;
    }
</style>




