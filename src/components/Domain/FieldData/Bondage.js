import { useUsersStore, useBondageStore, useFieldStore } from "../../store/store"


export class BondagePropBase {
    constructor(){
        // 注意：对应部位的顺序为眼睛、嘴巴、手臂、手指、双腿。
        this.name = ''
        this.content = '' // 介绍
        this.bondage_value = { // 束具提供的束缚值
            eye: 0,
            mouth: 0,
            arm: 0,
            finger: 0,
            leg: 0,
        }
        this.untie_able = true // 该束具是否允许挣扎
        this.cause = '' // 不能挣扎的原因，如上锁、魔法封印等
    }
    addAction() {
        const store = useUsersStore()
        const store_bondage = useBondageStore()
        const store_field = useFieldStore()
        let current_prop = null
        let log = `你正在被${this.name}拘束：`
        if(store.field_liluo.car.ownership && store.field_liluo.car.shields > 0) {
            store_field.addLogs('当前载具拥有护盾，该束缚不起作用。')
            return
        }
        if(store_bondage.all_props.map((item) => {return item.name}).includes(this.name)){ // 如果之前已经捆绑过该束具
            current_prop = store_bondage.all_props.filter((item) => { return item.name == this.name })[0]
        }
        for(let item in this.bondage_value){
            if(this.bondage_value[item] > 0){ // 如果该束具在对应部位有拘束值，则加入到对应部位上去。
                if(current_prop){ // 如果已经存在该束具，则将束具新的束缚状态更新上去
                    this.bondage_value[item] = this.bondage_value[item] - current_prop.bondage_value[item] // 更新束具时需要增加的拘束值
                    current_prop.bondage_value[item] += this.bondage_value[item] // 更新束具上的拘束值
                }
                if(!store_bondage.bondage_props[item].includes(this.name)){ // 如果该部位的束具中没有该束具，则加入进去
                    store_bondage.bondage_props[item].push(this.name)
                }
                log += `你已被${store_bondage.bondage_names[item].bondage}，${store_bondage.bondage_names[item].base}束缚值增加${this.bondage_value[item]};`
            }
        }
        if(!current_prop) { store_bondage.all_props.push(this) }
        store_bondage.addBondageValue(this.bondage_value)
        store_bondage.updateBondageStates()
        store_field.addLogs(log)
    }
}














