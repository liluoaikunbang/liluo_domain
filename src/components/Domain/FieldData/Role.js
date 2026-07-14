import { car_shop } from '../../Empire/TrialsCity/Shop'
import { role_skills } from "./RoleSkills"


export class PersonBase { // 人物及敌人的基本类
    constructor() {
        this.buffs = [] // 已有的buff
        this.debuffs = [] // 已有的debuff
    }
    displayBuffDebuff(mode) {
        const getBuffLogs = (buffs_debuffs) => {
            const buff_names = buffs_debuffs.map((item) => { return item.name })
            let buff_log = ''
            for(let i = 0; i < buff_names.length; i++) {
                buff_log += buff_names[i]
                if(i < buff_names.length - 1) { buff_log += '，' }
            }
            return buff_log
        }
        if(mode == 'buff') {
            if(this.buffs.length) { return getBuffLogs(this.buffs) }
            else { return '无buff' }
        }
        if(mode == 'debuff'){
            if(this.debuffs.length) {  return getBuffLogs(this.debuffs)  }
            else { return '无debuff' }
        }
    }
}

class RoleBase extends PersonBase { // 人物基本类
    constructor() {
        super()
        this.tie_value = 0 // 拘束值
    }
    updateState() { // 每回合结束时更新人物状态（人物行动结束即为该回合结束时）
        // 更新buff和debuff状态
        for(let i = 0; i < this.debuffs.length; i++) {
            this.debuffs[i].handle()
        }
    }
}

export const roles = { // 人物列表
    liluo: class extends RoleBase {
        constructor() {
            super()
            this.name = '璃落'
            this.max_HP = 100 // 最大体力
            this.HP = this.max_HP // 体力
            this.max_MP = 200 // 最大魔法
            this.MP = this.max_MP // 魔法
            this.ATK = 20 // 攻击
            this.DEF = 5 // 防御
            this.SPD = 10 // 速度
            this.car = car_shop.common[0] // 野外探险的车辆，可购买
            this.equipments = { // 装备
                memory: null, // 忆晶
                weapons: null, // 法器
                straps: [], // 束具
            }
            this.skills = role_skills.filter((skill) => { return skill.group == '自身' }).map((skill) => { return skill.name }) // 储存技能名称
        }
    },
}