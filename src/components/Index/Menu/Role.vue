<template>
    <div v-if="mode == 'sample'">
        <p class="menu-content none-indent">最大体力：{{ role.max_HP }};&ensp;体力(HP)：{{ role.HP }}</p>
        <p class="menu-content none-indent">最大魔法：{{ role.max_MP }};&ensp;魔法(MP)：{{ role.MP }}</p>
        <p class="menu-content none-indent">BUFF：{{ role.displayBuffDebuff('buff') }}</p>
        <p class="menu-content none-indent">DEBUFF：{{ role.displayBuffDebuff('debuff') }}</p>
    </div>
    <div v-if="mode == 'detail'">
        <h3>璃落详细属性</h3>
        <p class="menu-content none-indent">最大体力：{{ role.max_HP }};&ensp;体力(HP)：{{ role.HP }}</p>
        <p class="menu-content none-indent">最大魔法：{{ role.max_MP }};&ensp;魔法(MP)：{{ role.MP }}</p>
        <p class="menu-content none-indent">BUFF：{{ role.displayBuffDebuff('buff') }}</p>
        <p class="menu-content none-indent">DEBUFF：{{ role.displayBuffDebuff('debuff') }}</p>
        <p class="menu-content none-indent">攻击：{{ role.ATK }};&ensp;防御：{{ role.DEF }};&ensp;速度：{{ role.SPD }};</p>
        <p class="menu-content none-indent">装备——</p>
        <p class="menu-content one-indent">忆晶：{{ role.equipments.memory }};&ensp;法器：{{ role.equipments.weapons }};</p>
        <p class="menu-content one-indent">束具：<span v-for="item in role.equipments.straps" :key="item">{{ item }}</span></p>
        <p class="menu-content none-indent">束缚/脱缚(程度100以上则对应部位被完全拘束)——</p>
        <div :style="{opacity: store_bondage.visibility}">
            <p class="menu-content one-indent">整体被缚程度：{{ store_bondage.bondage_percent }}%</p>
            <p class="menu-content one-indent" v-for="(item, index) in store_bondage.bondage_values" :key="index">
                {{ store_bondage.bondage_names[index].bondage }}程度：{{ item }}&ensp;&ensp;;
                脱缚能力：{{ store.untie_values[index].current }}
            </p>
        </div>
        <a-collapse accordion>
            <a-collapse-item header="当前束缚状态" key="1">
                <p class="menu-content none-indent" v-if="!store_bondage.bondage_states.length">无特殊束缚状态。</p>
                <p class="menu-content one-indent" v-else v-for="item in store_bondage.bondage_states" :key="item">
                    {{ item.name }}:{{ item.content }}
                </p>
            </a-collapse-item>
        </a-collapse>
        <p class="menu-content none-indent">已穿戴束具(解缚时挣脱的束具顺序为从下往上)——</p>
        <a-collapse accordion>
            <a-collapse-item header="已缚束具" key="1">
                <a-collapse v-for="(props, index) in store_bondage.bondage_props" :key="index" accordion>
                    <a-collapse-item :header=store_bondage.bondage_names[index].base :key=index>
                        <p class="menu-content none-indent" v-if="props.length <= 0">该部位未被束缚</p>
                        <template v-else>
                            <p class="menu-content one-indent" v-for="item in store_bondage.getPropClassList(index)" :key="item">
                                {{ item.name }}
                                【<span v-if="item.untie_able">可挣脱</span>
                                <span v-else>{{ item.cause }}</span>】（束缚值/耐久度:{{ item.bondage_value[index] }}）——
                                {{ item.content }}
                            </p>
                        </template>
                    </a-collapse-item>
                </a-collapse>
            </a-collapse-item>
        </a-collapse>
        <p class="menu-content none-indent">当前技能列表(括号内为消耗魔法值)——</p>
        <a-collapse accordion>
            <a-collapse-item header="技能" key="1">
                <p class="menu-content one-indent" v-for="skill in findClassFromName(role.skills, role_skills)" :key="skill">
                    {{ skill.name }}({{ skill.MP_consumption }})：来自{{ skill.group }}，{{ skill.content }}
                </p>
            </a-collapse-item>
        </a-collapse>
    </div>
</template>

<script>
import { ref } from 'vue'
import LiButton from '../../base/LiButton.vue'
import { useUsersStore, useBondageStore } from '../../../store/store'
import { findClassFromName } from '../../../utils.js'
import { role_skills } from '../../FieldData/RoleSkills'
import { BondagePropBase } from '../../FieldData/Bondage'

export default {
    components: {
        LiButton,
    },
    props: ['mode'],
    setup(props) {

        const store = useUsersStore()
        const role = store.field_liluo
        const store_bondage = useBondageStore()

        return {
            store, role, role_skills, store_bondage,
            findClassFromName,
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




