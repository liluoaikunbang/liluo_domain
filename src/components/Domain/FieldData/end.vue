<template>
    <h2>结局：{{ end.title }}</h2>
    <p>{{ store_field.logs[store_field.logs.length - 1] }}</p>
    <p v-for="section in splitString(end.content)" :key="section">{{ section }}</p>
    <p>本次探险结束。</p>
</template>

<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import AttributeBox from './AttributeBox.vue'
import { useUsersStore, useFieldStore } from '../../store/store'
import { splitString } from '../../utils'

export default {
    components: {
        LiButton,
        AttributeBox,
    },
    props: [],
    setup(props) {
        const store = useUsersStore()
        const store_field = useFieldStore()
        const end = store_field.end

        return {
            end, store_field,
            splitString,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>



