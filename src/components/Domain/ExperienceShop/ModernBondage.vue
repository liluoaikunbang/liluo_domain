<template>
    <h2>逃脱游戏-都市风格</h2>
</template>


<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import { useUsersStore, useFieldStore, useBondageStore } from '@/store/store'


export default {
    components: {
        LiButton,
    },
    props: [],
    setup(props) {

        const store = useUsersStore()
        const store_field = useFieldStore()
        const store_bondage = useBondageStore()
        const data = reactive({

        })

        return {
            ...toRefs(data), store_bondage,
        }
    }
}

</script>

<style scoped>
    .shop-button {
        margin: 10px 10px 0 10px;
    }
</style>


