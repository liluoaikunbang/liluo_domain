import { role_skills } from "./RoleSkills"
import { useUsersStore, useBondageStore, useFieldStore } from "../../store/store"

// Debuff列表
export const debuff_list = {
    estrus: class {
        constructor(turn_number) {
            this.name = '发情'
            this.content = '所有技能消耗的魔法值翻倍。'
            this.turn_number = turn_number // 持续回合数
            this.turn_remainder = turn_number // debuff当前还剩下的回合数
            this.store = useUsersStore()
            this.store_field = useFieldStore()
        }
        handle() {
            if(this.turn_number == this.turn_remainder) { // 第一回合时，将debuff加到人物身上
                this.store.field_liluo.debuffs.push(this)
                for(let i = 0; i < role_skills.length; i++) { role_skills[i].MP_consumption *= 2 }
            }
            if(this.turn_remainder <= 0) { // debuff消失
                for(let i = 0; i < role_skills.length; i++) { role_skills[i].MP_consumption /= 2 }
                this.store.field_liluo.debuffs = this.store.field_liluo.debuffs.filter((item) => { return item.name != this.name })
            }
            this.turn_remainder -= 1
        }
    }
}