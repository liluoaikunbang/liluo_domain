<template>
    <div v-if="mode == 'sample'">
        <p class="menu-content one-indent" v-if="!car.ownership">暂无探险车辆，可至冒险区-穆妮卡帝国-帝国试炼城-户外车辆店购买。</p>
        <div v-else>
            <p class="menu-content none-indent">{{ car.level_name }}</p>
            <p class="menu-content none-indent">舒适度：{{ car.comfort }}</p>
            <p class="menu-content none-indent">最大护盾：{{ car.max_shields }};&ensp;护盾：{{ car.shields }}</p>
            <div v-if="car.shields > 0">
                <p class="menu-content none-indent" v-if="car.open_shields">当前护盾状态：开启</p>
                <p class="menu-content none-indent" v-else>当前护盾状态：关闭</p>
            </div>
            <p class="menu-content none-indent" v-else>当前护盾状态：破损</p>
        </div>
    </div>
    <div v-if="mode == 'detail'">
        <h3>探险车辆</h3>
        <p class="menu-content none-indent">{{ car.level_name }}</p>
        <p class="menu-content none-indent">舒适度：{{ car.comfort }}</p>
        <p class="menu-content none-indent">最大护盾：{{ car.max_shields }};&ensp;护盾：{{ car.shields }}</p>
        <div v-if="car.shields > 0">
            <p class="menu-content none-indent" v-if="car.open_shields">当前护盾状态：开启</p>
            <p class="menu-content none-indent" v-else>当前护盾状态：关闭</p>
        </div>
        <p class="menu-content none-indent" v-else>当前护盾状态：破损</p>
        <p class="menu-content none-indent">附加模块——</p>
        <p class="menu-content none-indent" v-for="module in getCarModule()" :key="module">
            {{ module.name }}：{{ module.content }}
        </p>
    </div>
</template>

<script>
import { ref } from 'vue'
import LiButton from '../../base/LiButton.vue'
import { useUsersStore } from '../../../store/store'
import { car_shop } from '../../Empire/TrialsCity/Shop'

export default {
    components: {
        LiButton,
    },
    props: ['mode'],
    setup(props) {

        const car = useUsersStore().field_liluo.car

        const getCarModule = () => {
            const modules = []
            let flag = false
            for(let i = 1; i < car.purchased_items.length; i++){ // 第一个模块固定为购买车辆，不用在模块列表显示
                let name = car.purchased_items[i]
                flag = false
                for(let item in car_shop){
                    if(flag == true) { break }
                    for(let j = 0; j < car_shop[item].length; j++){
                        if(name == car_shop[item][j].name) {
                            modules.push(car_shop[item][j])
                            flag = true
                            break
                        }
                    }
                }
            }
            return modules
        }

        return {
            car,
            getCarModule,
        }
    },
}
</script>

<style scoped>
    .none-indent {
        text-indent: 0em;
    }
    .one-indent {
        text-indent: 1em;
    }
    .index-button {
        margin: 0 0 10px 0;
    }
</style>




