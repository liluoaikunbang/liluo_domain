import { useUsersStore, useBondageStore, useFieldStore } from "../../store/store"
import { end_list } from "./end"
import { enemies } from "./Enemies"
import { afterRoleAction } from "./FieldUtils"

// 事件
class EventBase { // 事件基本类
    constructor(){
        this.store = useUsersStore()
        this.store_bondage = useBondageStore()
        this.store_field = useFieldStore()
    }
}

export const event_list = [
    class extends EventBase {
        constructor() {
            super()
            this.name = '偶遇蘑菇'
            this.content = '你的面前是一片草坪，不远处的草地上长着一朵脸盆大小的巨型红色蘑菇，大蘑菇旁边还长着不少正常个头的小蘑菇。这些蘑菇的伞帽都是鲜艳的红色，点缀着白色圆点，看起来非常可爱。'
            this.type = 'common' // 普通事件
            this.options = ['摘一朵小蘑菇', '坐在大蘑菇上自拍', '直接离开']
            this.children = {} // 选项内如果还有选项则放到这里
        }
        judge(index) {
            return {able: true, cause: ''}
        }
        handle(index) {
            afterRoleAction()
            if(index == 0){
                this.store_field.logs.push('你摘下一朵小蘑菇仔细观察，不禁感叹她长得是如此可爱，凑到鼻子前闻了闻，野山菇的清香沁人心脾。良久之后，你才依依不舍地将小蘑菇重新种回土里，准备继续前进，只是一抬头，你却看到眼前出现了三个跟你长得很像的小人正在自缚……挠了挠头，你大概猜测这应该是“眼前出现小人”的中毒现象……之后你便失去了意识……')
                this.store_field.button_mode = 'end'
                this.store_field.end = end_list[0]
            }
            else if(index == 1) {
                this.store_field.addLogs(`
                你坐在大蘑菇的伞帽上，取出手机正准备自拍，突然被一股巨力掀飞出去，回头一看，原地已没有大蘑菇，只有一个顶着蘑菇状帽子的女孩一脸怒容地盯着你。
                “哪来的坏家伙！竟敢坐在人家的头上！”
                “不……不是……咱不知道……”你刚想解释，却见对面的女孩飞奔着向你冲来，完全不听你解释。看来不得不战斗了。
                `)
                this.store_field.enemyMode(new enemies[0])
            }
            else if(index == 2) {
                this.store_field.addLogs('你无视了这些可爱的蘑菇，径直离开了这里。')
                this.store_field.att_other_mode = 'base'
                this.store_field.special_mode = 'progress'
            }
        }
    },
]