<template>
    <div v-if="mode == 'sample' && store_field.button_mode == 'base'">
        <LiButton class="trails-button" @click="clickStruggle()">挣扎</LiButton><br>
        <LiButton class="trails-button" @click="clickRest()">休整</LiButton><br>
        <LiButton class="trails-button" @click="clickClear()">清空日志</LiButton><br>
    </div>

    <div v-if="mode == 'detail'">
        <!-- 挣扎按钮 -->
        <BondageButton v-if="store_field.button_mode == 'untie'" />
        <!-- 休整按钮 -->
        <div v-if="store_field.button_mode == 'rest'">
            <LiButton class="trails-button" @click="clickRest()">继续休整</LiButton><br>
            <div v-if="store_field.role.car.ownership">
                <LiButton class="trails-button" v-if="store_field.role.car.open_shields" @click="clickShields()">关闭车辆护盾</LiButton>
                <LiButton class="trails-button" v-else @click="clickShields()">打开车辆护盾</LiButton><br>
            </div>
            <LiButton class="trails-button" @click="clickRestReturn()">结束休整</LiButton><br>
        </div>
    </div>
</template>

<script>
import { ref } from 'vue'
import LiButton from '../base/LiButton.vue'
import { useUsersStore, useFieldStore } from '../../store/store'
import { initSkills } from './RoleSkills'
import { Message } from '@arco-design/web-vue'
import BondageButton from './BondageButton.vue'
import { afterRoleAction } from './FieldUtils'


export default {
    components: {
        LiButton,
        BondageButton,
    },
    props: ['mode'],
    setup(props) {

        const store = useUsersStore()
        const store_field = useFieldStore()
        const step = ref('base')

        const clickStruggle = () => {
            store_field.button_mode = 'untie'
            store_field.att_role_mode = 'bondage'
        }
        const clickRest = () => { // 暂时休整选项
            store.game_step.game_menu.drawer = true
            store_field.button_mode = 'rest'
            Message.info('已打开游戏菜单，当前可进行存档读档、调整装备或使用道具。')
        }
        const clickShields = () => { // 打开/关闭车辆护盾
            if(store_field.role.car.open_shields){
                store_field.role.car.open_shields = false
                Message.info('已关闭车辆护盾，当前可以被捆绑或施加debuff。')
            }
            else {
                store_field.role.car.open_shields = true
                Message.info('已打开车辆护盾，护盾破碎前不会被捆绑技能或debuff技能影响。')
            }
        }
        const clickRestReturn = () => { // 休整完毕后继续
            store_field.logs.push('你休整了一会。')
            store_field.role_skills = initSkills(store_field.role) // 休整完要看看是否装备了新技能
            afterRoleAction()
        }

        const clickClear = () => {
            store_field.logs.splice(0)
        }

        return {
            step, store_field,
            clickStruggle,
            clickRest, clickShields, clickRestReturn,
            clickClear,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>