<template>
    <!-- 战斗按钮 -->
    <div v-for="item in store_field.role_skills" :key="item">
        <LiButton class="trails-button" v-if="item.type == '法术'" :disabled="item.MP_consumption > store_field.role.MP" @click="clickSkill(item)">{{ item.name }}({{ item.MP_consumption }}MP)</LiButton><br>
    </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import AttributeBox from './AttributeBox.vue'
import { useUsersStore, useFieldStore } from '../../store/store'
import { afterRoleAction } from './FieldUtils'


export default {
    components: {
        LiButton,
        AttributeBox,
    },
    props: [],
    setup(props) {
        const store = useUsersStore()
        const store_field = useFieldStore()

        const clickSkill = (skill) => { // 释放技能
            store_field.role.MP -= skill.MP_consumption
            store_field.logs.push(`你释放技能 ${skill.name}，` + skill.handle(store_field.role, store_field.enemy)) // 执行技能函数
            afterRoleAction()
        }

        return {
            store_field,
            clickSkill,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>



