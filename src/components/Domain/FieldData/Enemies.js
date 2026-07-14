import { PersonBase } from "./Role"
import { attack } from "./FieldUtils"
import { debuff_list } from "./BuffDebuff"
import { handleRandom } from '../../utils'
import { useUsersStore, useBondageStore, useFieldStore } from "../../store/store"
import { BondagePropBase } from "./Bondage"


class EnemyBase extends PersonBase { // 敌人基本类
    constructor() {
        super()
        this.skill_turn = [] // 技能循环释放顺序，列表中储存的为skills中的下标
        this.skills = [] // 技能
        this.store = useUsersStore()
        this.store_field = useFieldStore()
        this.store_bondage = useBondageStore()
    }
    useSkills(turn) { // 释放技能
        // 修正技能
        let skill_index = (turn - 1) % this.skill_turn.length
        // 释放技能
        let index = this.skill_turn[skill_index]
        this.store_field.addLogs(`${this.name}释放了技能 ${this.skills[index].name}：`)
        this.skills[index].handle(this)
        if(this.store.field_liluo.HP <= 0) {
            this.store_field.addLogs(`你已被${this.name}击倒。`)
            this.store_field.button_mode = 'end'
        }
    }
}

export const enemies = [ // 可能出现的敌人（注意，战斗中敌人一次只出现一只！）
    class extends EnemyBase {
        constructor() {
            super()
            this.value = 0
            this.name = '红伞蘑菇精'
            this.intro = ''
            this.species = '精怪科-真菌属-蘑菇种'
            this.location = ['森林', '平原', '山地'] // 可能出现该敌人的位置
            this.end_index = 0 // 被该敌人击败后导致的end的序号
            this.HP = 50
            this.ATK = 20
            this.DEF = 5
            this.SPD = 10
            this.skill_turn = [0, 0, 1]
            this.skills = [
                {
                    name: '蘑菇冲撞',
                    content: '助跑后用力撞向敌人，对敌方造成攻击力100%的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 1)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '发情孢子',
                    content: '释放让人发情的孢子，80%几率让敌人发情，持续一回合。',
                    handle(enemy) {
                        const debuff = new debuff_list.estrus(1)
                        const debuff_names = enemy.store.field_liluo.debuffs.map((item) => { return item.name })
                        if(handleRandom(80) && !debuff_names.includes(debuff.name)){
                            debuff.handle()
                            enemy.store_field.addLogs('让你陷入了发情状态。')
                        }
                        else { enemy.store_field.addLogs('无事发生。') }
                    },
                },
            ]
        }
    },
    class extends EnemyBase {
        constructor() {
            super()
            this.value = 1
            this.name = '功夫蜘蛛娘'
            this.intro = ''
            this.species = '妖兽科-昆虫属-蜘蛛种'
            this.location = ['森林', '平原', '山地'] // 可能出现该敌人的位置
            this.end_index = 0 // 被该敌人击败后导致的end的序号
            this.HP = 30
            this.ATK = 20
            this.DEF = 0
            this.SPD = 20
            this.skill_turn = [0, 0, 1, 0, 2, 0, 3]
            this.bondage_prop = class Prop extends BondagePropBase {
                constructor(eye, mouth, arm, finger, leg){
                    super()
                    this.name = '坚韧蛛丝'
                    this.content = '粘性强、韧性高的蛛丝，可以有效束缚身体。'
                    this.bondage_value = {
                        eye: eye,
                        mouth: mouth,
                        arm: arm,
                        finger: finger,
                        leg: leg,
                    }
                    this.untie_able = true
                    this.cause = ''
                }
            }
            this.skills = [
                {
                    name: '蛛蛛拳法',
                    content: '功夫蜘蛛一脉开创的契合蜘蛛娘习惯的拳法，猛烈的攻击可对敌方造成攻击力150%的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 1.5)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '蛛丝喷射-对上身',
                    content: '喷射出高粘性高韧性的蛛丝，将敌人的上身拘束起来。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`用蛛丝将你的手臂与手指在身侧缠绕拘束。`)
                        const prop = new enemy.bondage_prop(0, 0, 100, 100, 0)
                        prop.addAction()
                    },
                },
                {
                    name: '蛛丝喷射-对下身',
                    content: '喷射出高粘性高韧性的蛛丝，将敌人的双腿和脚丫拘束起来。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`用蛛丝将你的双腿和脚丫完全并拢拘束起来。`)
                        const prop = new enemy.bondage_prop(0, 0, 0, 0, 100)
                        prop.addAction()
                    },
                },
                {
                    name: '蛛丝喷射-对头部',
                    content: '喷射出高粘性高韧性的蛛丝，将敌人的头部包裹起来。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`用蛛丝将你的头部包裹起来，将你的双眼蒙住并产生了轻微的堵嘴效果。`)
                        const prop = new enemy.bondage_prop(100, 50, 0, 0, 0)
                        prop.addAction()
                    },
                },
            ]
        }
    },
    class extends EnemyBase {
        constructor() {
            super()
            this.value = 2
            this.name = '猫娘强盗'
            this.intro = ''
            this.species = '类人科-亚人属-猫娘种'
            this.location = ['森林', '平原', '山地'] // 可能出现该敌人的位置
            this.end_index = 0 // 被该敌人击败后导致的end的序号
            this.HP = 50
            this.ATK = 10
            this.DEF = 5
            this.SPD = 15
            this.skill_turn = [0, 0, 1, 0, 2]
            this.bondage_prop = [
                class extends BondagePropBase {
                    constructor(eye, mouth, arm, finger, leg){
                        super()
                        this.name = '普通麻绳'
                        this.content = '非常常见的麻绳，用来捆扎肉货再合适不过。'
                        this.bondage_value = {
                            eye: eye,
                            mouth: mouth,
                            arm: arm,
                            finger: finger,
                            leg: leg,
                        }
                        this.untie_able = true
                        this.cause = ''
                    }
                },
                class extends BondagePropBase {
                    constructor(eye, mouth, arm, finger, leg){
                        super()
                        this.name = '猫娘的袜子'
                        this.content = '某位猫娘小姐刚刚脱下的新鲜黑丝，除了织物的味道外几乎闻不到什么异味。'
                        this.bondage_value = {
                            eye: eye,
                            mouth: mouth,
                            arm: arm,
                            finger: finger,
                            leg: leg,
                        }
                        this.untie_able = true
                        this.cause = ''
                    }
                },
            ]
            this.skills = [
                {
                    name: '猫猫拳',
                    content: '猫娘拳法！可对敌方造成攻击力120%的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 1.2)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '捆缚术-绳捆索绑',
                    content: '经过长久训练而习得的捆缚术，能够在战斗中迅速而严密地紧缚对手。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`使用麻绳将你的双手五花大绑。`)
                        const prop = new enemy.bondage_prop[0](0, 0, 150, 0, 0)
                        prop.addAction()
                    },
                },
                {
                    name: '捆缚术-封嘴蒙眼',
                    content: '经过长久训练而习得的捆缚术，能在战斗中高效地将对方封嘴蒙眼。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`使用袜子将你的双眼蒙住，并将你的嘴巴堵死。`)
                        const prop = new enemy.bondage_prop[1](50, 80, 0, 0, 0)
                        prop.addAction()
                    },
                },
            ]
        }
    },
    class extends EnemyBase {
        constructor() {
            super()
            this.value = 3
            this.name = '普通触手怪' // 普通的触手怪还不会涩涩内容
            this.intro = ''
            this.species = '妖兽科-魔化属-粘液种'
            this.location = ['森林', '平原', '山地'] // 可能出现该敌人的位置
            this.end_index = 0 // 被该敌人击败后导致的end的序号
            this.HP = 50
            this.ATK = 1
            this.DEF = 10
            this.SPD = 10
            this.skill_turn = [0, 0, 1]
            this.bondage_prop = [
                class extends BondagePropBase {
                    constructor(eye, mouth, arm, finger, leg){
                        super()
                        this.name = '普通触手'
                        this.content = '传说中对魔法少女有特攻效果的触手！'
                        this.bondage_value = {
                            eye: eye,
                            mouth: mouth,
                            arm: arm,
                            finger: finger,
                            leg: leg,
                        }
                        this.untie_able = true
                        this.cause = ''
                    }
                },
            ]
            this.skills = [
                {
                    name: '触手鞭笞',
                    content: '用触手抽打敌人，虽然攻击性不强但附带的粘液可以对女孩子的心灵造成成吨暴击。对敌人造成100%攻击力的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 1)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '触手缠绕',
                    content: '使用触手捆绑缠绕敌人的手臂和双腿，不过由于普通触手怪的智慧不高，缠绕的力度较轻，比较容易挣脱。',
                    handle(enemy) {
                        enemy.store_field.addLogs(`用触手缠绕住了你的手臂和双腿，将你的双臂紧贴着身侧束缚起来，双腿也并拢拘束。`)
                        const prop = new enemy.bondage_prop[0](0, 0, 50, 0, 70)
                        prop.addAction()
                    },
                },
            ]
        }
    },
    class extends EnemyBase {
        constructor() {
            super()
            this.value = 4
            this.name = '魅魔侍卫' // 普通的触手怪还不会涩涩内容
            this.intro = '魅魔一族中的基本战斗人员，拥有一定物理战斗力并兼具魅魔一组特有的魅惑天赋。'
            this.species = '类人科-魔化属-魅魔种'
            this.location = ['森林', '平原', '山地'] // 可能出现该敌人的位置
            this.end_index = 0 // 被该敌人击败后导致的end的序号
            this.HP = 100
            this.ATK = 30
            this.DEF = 15
            this.SPD = 15
            this.skill_turn = [0, 0, 1]
            this.bondage_prop = [
            ]
            this.skills = [
                {
                    name: '枪击',
                    content: '用佩戴的长枪攻击敌人，对敌人造成120%攻击力的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 1.2)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '重击',
                    content: '蓄力后用长枪重重地攻击敌人，对敌人造成200%攻击力的伤害。',
                    handle(enemy) {
                        const damage = attack(enemy, enemy.store.field_liluo, 2)
                        enemy.store_field.addLogs(`对你造成了${damage}点伤害。`)
                    },
                },
                {
                    name: '魅惑',
                    content: '运用魅魔一族的天赋魅惑敌人，80%概率让敌人陷入2回合的发情状态。',
                    handle(enemy) {
                        const debuff = new debuff_list.estrus(2)
                        const debuff_names = enemy.store.field_liluo.debuffs.map((item) => { return item.name })
                        if(handleRandom(80) && !debuff_names.includes(debuff.name)){
                            debuff.handle()
                            enemy.store_field.addLogs('让你陷入了发情状态。')
                        }
                        else { enemy.store_field.addLogs('无事发生。') }
                    },
                },
            ]
        }
    },
]



