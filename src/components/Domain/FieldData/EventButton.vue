<template>
    <!-- 事件按钮 -->
    <div v-for="(item, index) in event.options" :key="index">
        <LiButton class="trails-button" :disabled="!event.judge(index).able" @click="event.handle(index)">
            {{ item }}
            <span v-if="!event.judge(index).able">(event.judge(index).cause)</span>
        </LiButton><br>
    </div>
</template>

<script>
import { reactive, toRefs } from 'vue'
import LiButton from '../base/LiButton.vue'
import AttributeBox from './AttributeBox.vue'
import { useUsersStore, useFieldStore } from '../../store/store'

export default {
    components: {
        LiButton,
        AttributeBox,
    },
    props: [],
    setup(props) {
        const store = useUsersStore()
        const store_field = useFieldStore()
        const event = store_field.event

        return {
            event,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
</style>



