<template>
    <div v-if="step == 'start'">
        <h2>敌人图鉴</h2>
        <p>敌人图鉴，记录了所有可能遇到的敌人的信息。</p><br>
        <template v-for="item in enemy_data" :key="item">
            <div class="enemy">
                <p>{{ item.name }}</p>
                <LiButton class="trials-button" @click="step = item.name">详情</LiButton>
            </div>
            <br>
        </template>
    </div>

    <div v-for="item in enemy_data" :key="item">
        <div v-if="step == item.name">
            <h2>{{ item.name }}</h2>
            <p>种族：{{ item.species }}</p>
            <p>体力(HP)：{{ item.HP }}&ensp;&ensp;速度(SPD)：{{ item.SPD }}</p>
            <p>攻击(ATK)：{{ item.ATK }}&ensp;&ensp;防御(DEF)：{{ item.DEF }}</p><br>
            <p>技能——</p>
            <p>释放顺序：{{ getSkillTurn(item) }}</p><br>
            <p v-for="skill in item.skills" :key="skill">{{ skill.name }}：{{ skill.content }}</p>
        </div>
    </div>

    <br><br>
    <LiButton class="trials-button" v-if="step != 'start'" @click="step = 'start'">返回</LiButton><br>
</template>

<script>
import { ref, onMounted, getCurrentInstance } from 'vue'
import LiButton from '../../base/LiButton.vue'
import { splitString, } from '@/utils'
import { useUsersStore } from '@/store/store'
import { enemies } from '../../FieldData/Enemies'


export default {
    components: {
        LiButton,
    },
    setup() {

        const step = ref('start')
        const store = useUsersStore()
        const enemy_data = enemies.map((item) => {return new item})

        const getSkillTurn = (enemy) => {
            let turn_display = ''
            const skill_names = enemy.skill_turn.map((item) => { return enemy.skills[item].name })
            return skill_names.join('; ') + '。'
        }

        return {
            step, store, enemy_data,
            getSkillTurn,
            splitString,
        }
    }
}

</script>

<style scoped>
    .trials-button {
        margin: 0 10px 0px 10px;
    }
    .enemy {
        display: flex;
        flex-direction: row;
        justify-content : space-between;
    }
</style>



