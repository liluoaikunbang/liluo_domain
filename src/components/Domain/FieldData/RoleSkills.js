import { attack } from "./FieldUtils"

export const role_skills = [
    // 原有技能
    {
        name: '笨梨炸弹',
        content: '召唤出一颗梨状炸弹仍向敌人，对敌方造成100%攻击力的伤害。消耗10点体力。',
        MP_consumption: 10,
        type: '法术',
        group: '自身',
        handle(role, enemy) { 
            const damage = attack(role, enemy, 1)
            return `对敌人造成了${damage}点伤害。`
        }
    },
    // 缚神的恩赐
    {
        name: '梨之祝福-治愈',
        content: '向缚神祈祷，治疗自身伤势。恢复50%最大体力',
        MP_consumption: 100,
        type: '法术',
        group: '缚神的恩赐',
        handle(role, enemy) { 
            const recovery = role.max_HP / 2
            role.HP += recovery
            if(role.HP > role.max_HP) { role.HP = role.max_HP }
            return `恢复了自身${recovery}点体力`
        }
    },
    {
        name: '梨之祝福-回魔',
        content: '向缚神祈祷，快速回复魔法，本回合体力值魔法100点。',
        MP_consumption: 0,
        type: '法术',
        group: '缚神的恩赐',
        handle(role, enemy) {
            role.MP += 100
            if(role.MP > role.max_MP) { role.MP = role.max_MP }
            return `恢复了100点魔法值。`
        }
    },
]

export const initSkills = (role) => { // 初始化人物skills，将skill名称列表转变为object
    const skills = role.skills.map((item) => {
        return role_skills.filter((skill) => { return skill.name == item })[0]
    })
    return skills
}



