<template>
    <div class="container">
        <md-editor
            class="editor"
            v-model="content"
            @files-update="onFileUpdate"
            :renderKeys="['1']"
        />
        <div class="render">
            <md-render :codeStyle="style" :content="content" renderKey="1" />
            <md-render :codeStyle="style" :content="content" renderKey="1" />
            <md-render :codeStyle="style" :content="content" renderKey="1" />

            <md-render :codeStyle="style" :content="content" renderKey="1" />
        </div>
    </div>
</template>

<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup

import { ref } from "vue";
import MdRender from "./components/MdRender/MdRender";
import MdEditor from "./components/MdEditor/MdEditor";
import HljsStyleEnums from "./types/hljs-style-enum";

const content = ref("");
const style = ref(HljsStyleEnums["github-dark"]);

// 当上传的文件更新
function onFileUpdate(files: File[]) {
    console.log(files);
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
    width: 25%;
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
    width: 25%;
    height: 100%;
    padding: 20px;
    margin: 20px;
    line-height: 24px;
    border-radius: 4px;
    box-shadow: 0px 0px 8px rgba(0, 0, 0, 0.2);
    overflow: auto;
}
</style>
