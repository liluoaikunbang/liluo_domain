<template>
    <div v-if="mode == 'start'">
        <h2>户外车辆店</h2>

        <a-collapse :default-active-key="judgeDefautActiveKey()" accordion>
            <a-collapse-item header="普通户外车" key="1">
                <div class="product" v-for="item in car_shop.common" :key="item">
                    <p class="product-content">({{ judgeButtonAble(1, item)[1] }}){{ item.name }}:{{ item.price }}帝国金币，{{ item.content }}</p>
                    <LiButton class="trials-button" :disabled="!judgeButtonAble(1, item)[0]" @click="handlePurchase(item)">购买</LiButton>
                </div>
            </a-collapse-item>
            <a-collapse-item header="小型床车" key="2">
                <div class="product" v-for="item in car_shop.bed" :key="item">
                    <p class="product-content">({{ judgeButtonAble(2, item)[1] }}){{ item.name }}:{{ item.price }}帝国金币，{{ item.content }}</p>
                    <LiButton class="trials-button" :disabled="!judgeButtonAble(2, item)[0]" @click="handlePurchase(item)">购买</LiButton>
                </div>
            </a-collapse-item>
            <a-collapse-item header="魔改房车" key="3">
                <div class="product" v-for="item in car_shop.house" :key="item">
                    <p class="product-content">({{ judgeButtonAble(3, item)[1] }}){{ item.name }}:{{ item.price }}帝国金币，{{ item.content }}</p>
                    <LiButton class="trials-button" :disabled="!judgeButtonAble(3, item)[0]" @click="handlePurchase(item)">购买</LiButton>
                </div>
            </a-collapse-item>
        </a-collapse>

    </div>
</template>

<script>
import { ref, onMounted, getCurrentInstance } from 'vue'
import LiButton from '../../base/LiButton.vue'
import { splitString, } from '@/utils'
import { car_shop } from './Shop'
import { useUsersStore } from '@/store/store'
import { Message } from '@arco-design/web-vue';


export default {
    components: {
        LiButton,
    },
    setup() {

        const mode = ref('start')
        const store = useUsersStore()

        const judgeDefautActiveKey = () => {
            const current_car = store.field_liluo.car
            if(!current_car.ownership) { return ['1'] }
            else if(current_car.level == 3 || current_car.purchased_items.length >= car_shop.common.length + car_shop.bed.length) { return ['3'] }
            else if(current_car.level == 2 || current_car.purchased_items.length >= car_shop.common.length) { return ['2'] }
            else if(current_car.level == 1) { return ['1'] }
        }

        const judgeButtonAble = (level, product_item) => {
            const product = product_item // 将类实例化
            const current_car = store.field_liluo.car
            const current_level = judgeDefautActiveKey()
            const target_car = car_shop[Object.keys(car_shop)[current_level - 1]][0]
            if(current_car.ownership) {
                if(current_car.purchased_items.includes(product.name)) { return [false, '已购'] } // 已购商品
                if(!current_car.purchased_items.includes(target_car.name)) { // 如果没买当前阶段的车辆
                    if(product.name != target_car.name) { return [false, '请先升级车辆'] } // 必须先买车再进行改造
                }
            }
            else {
                if(product.name != target_car.name) { return [false, '请先购买车辆'] } // 必须先买车再进行改造
            }
            if(level != current_level) { return [false, '车辆条件不足'] } // 只能购买当前阶段的商品
            if(!product.judgeAble(store)) { return [false, '帝国金币不足'] } // 不够钱的不能购买
            return [true, '可购买']
        }

        const handlePurchase = (item) => {
            store.field_liluo.car.purchased_items.push(item.name)
            store.country_money -= item.price
            if(item.handle_frequency.includes('once')) { item.handleOnce(store.field_liluo.car) } 
            Message.info(`成功购买${item.name}`)
        }

        return {
            mode, store,
            judgeDefautActiveKey, judgeButtonAble, handlePurchase,
            car_shop,
            splitString,
        }
    }
}

</script>

<style scoped>
    .trials-button {
        margin: 0 10px 20px 10px;
    }
    .product {
        display: flex;
        flex-direction: row;
        justify-content : space-between;
    }
</style>



