<template>
    <div v-if="step == 'main'">
        <h3>当前装备</h3>
        <p>忆晶：{{ store.field_liluo.equipments.memory }}</p>
        <p>法器：{{ store.field_liluo.equipments.weapons }}</p>
        <p>束具：{{ store.field_liluo.equipments.straps }}</p>
        <h3>全部背包</h3>
        <a-collapse accordion>
            <a-collapse-item header="装备" key="1">
                <a-collapse accordion>
                    <a-collapse-item header="忆晶" key="1.1">
                        <p v-if="!bag.equipment.memory.length">暂无忆晶</p>
                        <div class="item" v-else>
                            <template v-for="item in findClassFromName(bag.equipment.memory, memory_list)" :key="item">
                                <p class="thing">{{ item.name }}</p>
                                <LiButton class="index-button" @click="step = item.name">详情</LiButton>
                                <LiButton class="index-button" :disabled="store.field_liluo.equipments.memory == item.name" @click="item.handleOnce(store.field_liluo)">装备</LiButton>
                            </template>
                        </div>
                    </a-collapse-item>
                    <a-collapse-item header="法器" key="1.2">
                        <p v-if="!bag.equipment.weapons.length">暂无法器</p>
                        <div class="item" v-else>
                            
                        </div>
                    </a-collapse-item>
                    <a-collapse-item header="特殊服装" key="1.3">
                        <p v-if="!bag.equipment.straps.length">暂无特殊服装</p>
                        <div class="item" v-else>
                            
                        </div>
                    </a-collapse-item>
                </a-collapse>
            </a-collapse-item>
            <a-collapse-item header="材料" key="2">
                <p v-if="!bag.materials.length">暂无材料</p>
                <div class="item" v-else>
                    
                </div>
            </a-collapse-item>
            <a-collapse-item header="消耗品" key="3">
                <p v-if="!bag.consumables.length">暂无消耗品</p>
                <div class="item" v-else>
                    
                </div>
            </a-collapse-item>
        </a-collapse>
    </div>

    <!-- 忆晶详细信息 -->
    <div v-for="item in memory_list" :key="item">
        <template v-if="step == item.name">
            <h3>忆晶：{{ item.name }}</h3>
            <p class="menu-content">附加技能——</p>
            <p class="menu-content" v-for="skill in item.skills" :key="skill">{{ skill.name }}(消耗体力{{ skill.MP_consumption }}):{{ skill.content }}</p>
            <br><br>
            <p class="menu-content backstory">{{ item.content }}</p>
            <br>
            <p class="menu-content" v-for="section in splitString(item.intro)" :key="section">{{ section }}</p>
        </template>
    </div>

    <LiButton class="return-button" v-if="step != 'main'" @click="step = 'main'">返回</LiButton>
</template>

<script>
import { ref, } from 'vue'
import LiButton from '../../base/LiButton.vue'
import { useUsersStore } from '../../../store/store'
import { memory_list } from './Bag.js'
import { splitString, findClassFromName } from '../../../utils'
export default {
    components: {
        LiButton,
    },
    setup() {
        const store = useUsersStore()
        const bag = store.bag
        const step = ref('main')

        return {
            step, store, bag,
            memory_list,
            findClassFromName, splitString,
        }
    },
}
</script>

<style scoped>
    .index-button {
        margin: 0 0 10px 0;
    }
    .item {
        display: flex;
        flex-direction: row;
        justify-content : space-between;
    }
    .thing {
        text-indent: 0;
    }
    .backstory {
        font-style: italic;
        opacity: 0.7;
    }
</style>




