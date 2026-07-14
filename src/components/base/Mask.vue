<template>
    <div class="mask" @click="click()">
    </div>
    <div class="dialog">
        <slot></slot>
    </div>
</template>

<script>

export default {
    setup() {

        const click = () => {
            console.log(111)
        }
        return {
            click
        }
    }
}
</script>

<style scoped>
    .mask {
        background: gray;
        position: fixed;
        left: 0px;
        top: 0px;
        width: 100%;
        height: 100%;
        z-index: 20;
        filter: alpha(opacity=60);
        opacity: 0.6 !important;
    }

    .dialog {
        position: absolute;
        z-index: 21;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
</style>


