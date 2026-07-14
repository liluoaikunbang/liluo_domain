<template>
    <canvas class="liluo-map" id="myCanvas" width="550" height="400"></canvas> 
</template>

<script>
export default {
    setup() {
        onMounted(() => {
            const map = document.getElementById("myCanvas")
            const ctx = map.getContext("2d")
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 3
            ctx.fillStyle = 'white' // 字体和填充颜色
            ctx.font="60px 楷体"

            ctx.moveTo(0,300)
            ctx.lineTo(550,300)
            ctx.moveTo(250,0)
            ctx.lineTo(250,300)
            ctx.stroke()

            ctx.fillText("牢房", 50, 160)
            ctx.fillText("卫生间", 300, 160)
            ctx.fillText("走廊", 220, 370)
        })
        return {
        }
    }
}
</script>

<style scoped>
    .liluo-map{
        border:1px solid #fcfcfc;
        width: 200px;
    }
</style>


