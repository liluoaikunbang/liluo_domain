<template>
    <div v-for="(item, index) in store_bondage.bondage_names" :key="index">
        <LiButton class="trails-button" :disabled="!judgeButton(index).able" @click="clickButton(index)">
            挣脱{{ item.base }}束缚({{ judgeButton(index).note }})
        </LiButton><br>
    </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import { useUsersStore, useFieldStore, useBondageStore } from '../../store/store'
import lodash from 'lodash'
import { afterRoleAction } from './FieldUtils'


export default {
    components: {
    LiButton,
},
    props: [],
    setup(props) {

        const store = useUsersStore()
        const store_field = useFieldStore()
        const store_bondage = useBondageStore()

        const judgeButton = (item_key) => {
            if(store_bondage.bondage_values[item_key] <= 0){ return {able: false, note: '无束缚'} } // 该部位没束缚
            const bondage_prop = store_bondage.getPropClass(item_key)
            if(!bondage_prop.untie_able) { return {able: false, note: bondage_prop.cause} } // 该部位不允许挣扎

            return {able: true, note: `${bondage_prop.name}-耐久:${bondage_prop.bondage_value[item_key]}`} // 标记当前要挣脱的道具
        }

        const clickButton = (item_key) => {
            const bondage_prop = store_bondage.getPropClass(item_key) // 获取该部位的活跃束具
            const remain_value = bondage_prop.bondage_value[item_key]
            // 根据脱缚能力计算对束缚的影响值
            const untie_values = lodash.clone(store.untie_values)
            for(let item in untie_values){
                if(item != item_key){
                    untie_values[item] = 0
                }
                else {
                    untie_values[item] = -store.untie_values[item].current
                }
            }
            let log = '你尝试挣扎，'
            
            bondage_prop.bondage_value[item_key] += untie_values[item_key]
            if(bondage_prop.bondage_value[item_key] <= 0) { // 该束具该位置已被挣脱
                store_bondage.bondage_props[item_key].filter((item) => { return item != bondage_prop.name }) // 把该部位的该束具去掉
                untie_values[item_key] = -remain_value // 将对束缚的影响值调整为该束具剩下的束缚值，防止多减少总束缚值
                log += `成功挣脱了束具${bondage_prop.name}，`
            }
            else {
                log += `减少了${-untie_values[item_key]}点${bondage_prop.name}的耐久度，`
            }
            store_bondage.addBondageValue(untie_values)
            store_bondage.updateBondageStates()
            log += `并减少了${-untie_values[item_key]}点${store_bondage.bondage_names[item_key].base}的拘束值。`

            store_field.addLogs(log)
            store_field.att_role_mode = 'base'
            afterRoleAction()
        }

        return {
            store_field, store_bondage,
            judgeButton, clickButton,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>