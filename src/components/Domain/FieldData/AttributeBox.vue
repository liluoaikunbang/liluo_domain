<template>
    <div class="room-box">
        <div class="room-1">
            <p class="room-title">{{ role.name }}&ensp;<LiButton @click="clickDetails()">详细属性</LiButton></p>
            <div v-if="att_role_mode == 'base'">
                <div class="room-subbox">
                    <p class="room-line">HP:{{ role.HP }}&ensp;&ensp;</p>
                    <p class="room-line">MP:{{ role.MP }}</p>
                </div>
                <div class="room-subbox">
                    <p class="room-line">ATK:{{ role.ATK }}&ensp;&ensp;</p>
                    <p class="room-line">DEF:{{ role.DEF }}</p>
                </div>
                <p class="room-line">BUFF:{{ role.displayBuffDebuff('buff') }}</p>
                <p class="room-line">DEBUFF:{{ role.displayBuffDebuff('debuff') }}</p>
            </div>
            <div v-if="att_role_mode == 'bondage'" :style="{ opacity: store_bondage.visibility }">
                <p class="room-line">总束缚程度：{{ store_bondage.bondage_percent }}%</p>
                <div class="room-subbox">
                    <p class="room-line">{{ store_bondage.bondage_names.eye.bondage }}:{{ store_bondage.bondage_values.eye }}&ensp;</p>
                    <p class="room-line">{{ store_bondage.bondage_names.mouth.bondage }}:{{ store_bondage.bondage_values.mouth }}</p>
                </div>
                <div class="room-subbox">
                    <p class="room-line">{{ store_bondage.bondage_names.arm.bondage }}:{{ store_bondage.bondage_values.arm }}&ensp;</p>
                    <p class="room-line">{{ store_bondage.bondage_names.finger.bondage }}:{{ store_bondage.bondage_values.finger }}</p>
                </div>
                <p class="room-line">{{ store_bondage.bondage_names.leg.bondage }}:{{ store_bondage.bondage_values.leg }}</p>
            </div>
        </div>
        <div class="room-2" :style="{ opacity: store_bondage.visibility }">
            <template v-if="att_other_mode == 'enemy'">
                <p class="room-title">{{ enemy.name }}</p>
                <div class="room-subbox">
                    <p class="room-line">HP:{{ enemy.HP }}</p>
                </div>
                <div class="room-subbox">
                    <p class="room-line">ATK:{{ enemy.ATK }}&ensp;&ensp;</p>
                    <p class="room-line">DEF:{{ enemy.DEF }}</p>
                </div>
                <p class="room-line">BUFF:{{ enemy.displayBuffDebuff('buff') }}</p>
                <p class="room-line">DEBUFF:{{ enemy.displayBuffDebuff('debuff') }}</p>
            </template>
            <template v-if="att_other_mode == 'event'">
                <p class="room-title">事件：{{ event.name }}</p>
            </template>
        </div>
    </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import { useUsersStore, useFieldStore, useBondageStore } from '../../store/store'


export default {
    components: {
    LiButton,
},
    props: [],
    setup(props) {

        const store = useUsersStore()
        const store_field = useFieldStore()
        const store_bondage = useBondageStore()
        const data = reactive(store_field.$state)

        const clickDetails = () => {
            store.game_step.game_menu.drawer = true
            store.game_step.game_menu.main.step = 'role'
            store.game_step.game_menu.main.return_button = false
        }

        return {
            ...toRefs(data), store_bondage,
            clickDetails,
        }
    }
}

</script>

<style scoped>
    .room-box {
        width: 100%;
        height: 18vh;
        border: 3px solid pink;
        border-radius: 5px;
        margin-bottom: 20px;
        overflow: auto;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        padding: 5px;
    }
    .room-subbox {
        display: flex;
        flex-direction: row;
        justify-content: space-between;
    }
    .room-title {
        text-indent: 0;
        text-align: center;
    }
    .room-line {
        text-indent: 0;
        text-align: left;
        font-size: 18px;
    }
    .card-content {
        text-indent: 0;
        font-size: 15px;
    }
</style>