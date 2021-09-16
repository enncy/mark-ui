<template>
    <div class="container">
        <md-editor
            class="editor"
            v-model="content"
            @files-update="onFileUpdate"
            :renderKeys="[1, 2]"
        />

        <md-render class="render" :codeStyle="style" :content="content" :renderKey="1" />
    </div>
</template>

<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { nextTick, ref, watch } from "vue";
import MdRender from "@/components/MdRender.vue";
import MdEditor from "./components/MdEditor.vue";
import HljsStyleEnums from "./types/hljs-style-enum";
import { autoChangeStyle } from "./utils/render";

const content = ref("");
const style = ref(HljsStyleEnums["github-dark"]);

// 当上传的文件更新
function onFileUpdate(files: File[]) {
    console.log(files);
}

nextTick(() => {
    autoChangeStyle();
});

watch(content, () => {
    autoChangeStyle();
});

function onStyleChange(_style: HljsStyleEnums) {
    style.value = _style;
}
</script>

<style scope lang="less">
@import "./assets/css/common.css";
@import "./assets/css/hljs.min.css";

.container {
    height: 100%;
    padding: 100px;
    display: flex;
    justify-content: space-around;
    align-content: center;
    align-items: center;
}

.editor {
    width: 95%;
    height: 100%;
    line-height: 24px;
    border: unset;
    resize: none;
    padding: 20px;
    margin: 20px;
    border-radius: 4px;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
    outline: none;
}

.render {
    width: 95%;
    height: 100%;
    padding: 20px;
    margin: 20px;
    line-height: 24px;
    border-radius: 4px;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
    overflow: auto;

    img {
        max-width: 100%;
    }

    pre {
        max-width: 100%;
    }
}

.selector {
}
</style>
