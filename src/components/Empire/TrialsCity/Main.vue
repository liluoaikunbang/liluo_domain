<template>
    <div v-if="store_field.step == 'base'">
        <h2>帝国试炼城</h2>
        <!-- 属性区 -->
        <AttributeBox />
        <!-- 日志区 -->
        <LogBox />
        <!-- 按钮区 -->
        <div v-if="store_field.button_mode == 'base'">
            <!-- 面对敌人时 -->
            <LiButton class="trails-button" v-if="store_field.att_other_mode == 'enemy'" @click="store_field.button_mode = 'fighting'">法术</LiButton>
            <!-- 面对事件时 -->
            <LiButton class="trails-button" v-if="store_field.att_other_mode == 'event'" @click="store_field.button_mode = 'event'">事件选项</LiButton><br>
            <!-- 通用按钮 -->
            <GeneralButton :mode="'sample'"/>
            <!-- 试炼城的特殊功能按钮 -->
            <div v-if="store_field.special_mode == 'progress'">
                <!-- 下一个房间 -->
                <LiButton class="trails-button" @click="updateRoom()">前进</LiButton>
            </div>
        </div><br>

        <!-- 事件按钮 -->
        <EventButton v-if="store_field.button_mode == 'event'" />
        <!-- 战斗按钮 -->
        <Fighting v-if="store_field.button_mode == 'fighting'"/>
        <!-- 通用按钮 -->
        <GeneralButton :mode="'detail'"/>
        <!-- 游戏结束 -->
        <LiButton class="trails-button" v-if="store_field.button_mode == 'end'" @click="store_field.step = 'end'">结束</LiButton>

        <LiButton class="trails-button" v-if="store_field.button_mode != 'base' && store_field.button_mode != 'end'" @click="clickReturn()">返回</LiButton><br>
    </div>

    <end v-if="store_field.step == 'end'" />

</template>

<script>
import { ref, reactive, toRefs, onMounted, getCurrentInstance } from 'vue'
import LiButton from '../../base/LiButton.vue'
import AttributeBox from '../../FieldData/AttributeBox.vue'
import EventButton from '../../FieldData/EventButton.vue'
import Fighting from '../../FieldData/Fighting.vue'
import GeneralButton from '../../FieldData/GeneralButton.vue'
import LogBox from '../../FieldData/LogBox.vue'
import end from '../../FieldData/end.vue'
import { event_list } from '../../FieldData/Events'
import { useBondageStore, useFieldStore, useUsersStore } from '../../../store/store'
import { Message } from '@arco-design/web-vue'
import { enemies } from '../../FieldData/Enemies'


export default {
    components: {
        LiButton,
        AttributeBox,
        LogBox,
        EventButton,
        Fighting,
        GeneralButton,
        end,
    },
    setup() {
        const store = useUsersStore()
        const store_field = useFieldStore()
        const store_bondage = useBondageStore()
        const data = reactive({
            room: 0, // 当前在第几个房间
        })

        const updateRoom = () => { // 进入新房间
            store_field.initState()
            data.room += 1
            store_field.logs.push(`已进入试炼城第 ${data.room} 个房间。`)
            // 过后补充抽取事件或敌人
            // 临时变量
            store_field.enemyMode(new enemies[2])
            // 临时变量
        }

        updateRoom() // 刚进试炼城时已经进入了第一个房间

        const clickReturn = () => {
            store_field.button_mode = 'base'
            store_field.att_role_mode = 'base'
        }


        return {
            ...toRefs(data), store_field, store_bondage,
            updateRoom, 
            clickReturn,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>



