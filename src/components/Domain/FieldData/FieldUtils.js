import { useUsersStore, useFieldStore, useBondageStore } from "../../../store/store"

export const enterField = (hide_domain_return_button) => { // 进入野外时通用的操作
    const store = useUsersStore()
    store.game_step.game_menu.able = false // 野外禁止打开游戏菜单
    store.game_step.field = true // 开启野外标识
    if(hide_domain_return_button){ // 禁止直接回到领地
        store.game_step.main.return_button = false
    }
}

export const leaveField = (display_domain_return_button) => { // 离开野外时的通用操作
    const store = useUsersStore()
    const store_field = useFieldStore()
    const store_bondage = useBondageStore()
    store.game_step.game_menu.able = true // 恢复游戏菜单功能
    store.game_step.field = false // 离开野外的标志
    store.field_liluo.car.open_shields = true // 退出时把护盾恢复默认的打开状态
    store_bondage.clearBondage() // 离开野外时清空身上的束缚
    store_field.step = 'base' // 离开野外时将step初始化
    store_field.initState() // 离开野外初始化身上的状态
    store_field.logs.splice(0) // 离开野外时清空之前的日志
    if(display_domain_return_button){ // 允许直接回到领地
        store.game_step.main.return_button = true
    }
}


export const attack = (initiator, receiver, proportion) => { // 对目标造成攻击(人物攻击减敌人防御得到的差值取大于零的部分乘倍率)，返回敌方受到的伤害值
    let damage = parseInt((initiator.ATK - receiver.DEF) * proportion)
    if(damage <= 0) { damage = 1 } // 如果没法破防，则固定伤害为1
    receiver.HP -= damage
    if(receiver.HP < 0) { receiver.HP = 0 }
    return damage
}

export const afterRoleAction = () => { // 人物行动之后的操作
    const store_field = useFieldStore()
    const store_bondage = useBondageStore()
    store_field.button_mode = 'base' // 行动后回到主按钮界面
    store_field.role.updateState(store_field.enemy) // 更新buff或debuff状态
    
    if(store_bondage.bondage_percent > 0){ // 执行身上的束缚造成的伤害
        let bondage_damage = parseInt(store_bondage.bondage_percent / 100 * store_bondage.damage_rate)
        store_field.role.HP -= bondage_damage
        store_field.addLogs(`身上的束缚带来额外的折磨，让你的体力下降${bondage_damage}点。`)
    }

    if(store_field.att_other_mode == 'enemy'){ // 如果是在战斗中
        if(store_field.enemy.HP <= 0) { // 判断敌人是否已经倒地
            store_field.logs.push('敌人已被击败！')
            store_field.att_other_mode = 'base'
            store_field.special_mode = 'progress'
            return
        }
        store_field.enemyAction() // 敌人行动（如果敌人已经行动则跳过）
        store_field.updateTurn() // 回合结束
    }

    if(store_field.role.HP <= 0) { // 如果体力归零，进入失败界面
        store_field.addLogs('体力过低，你失去了意识。')
        store_field.button_mode = 'end'
    }
}



