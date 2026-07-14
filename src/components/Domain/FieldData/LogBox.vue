<template>
    <div class="log-box" id="log_box">
        <p v-for="item of logs" :key="item">{{ item }}</p>
    </div>
</template>

<script>
import { ref, toRefs, onMounted, watch } from 'vue'
import LiButton from '../base/LiButton.vue'
import { useFieldStore } from '../../store/store'


export default {
    components: {
        LiButton,
    },
    props: [],
    setup(props) {

        const store_field = useFieldStore()
        const logs = store_field.logs

        onMounted(() => {
            watch(() => [...logs], (new_logs, old_logs) => {
                // 更新log窗口，让窗口的滚动条一直在底部
                let log_box = document.getElementById('log_box')
                setTimeout(() => {
                    log_box.scrollTop = log_box.scrollHeight;
                }, 20); // 注意这里需要延迟20ms正好可以获取到更新后的dom节点
            })
        })

        return {
            logs,
        }
    }
}

</script>

<style scoped>
    .trails-button {
        margin: 0 10px 20px 10px;
    }
    .log-box {
        width: 100%;
        height: 30vh;
        overflow: auto;
        border: 3px solid pink;
        border-radius: 5px;
        padding: 5px;
        margin-bottom: 20px;
    }
</style>