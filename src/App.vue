<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { inject, onMounted, ref, watch } from "vue";
import MdRender from "@/components/MdRender.vue";
import MdEditor from "./components/MdEditor.vue";
import hljs from "highlight.js";
import MdCssSelector from "./components/MdCssSelector.vue";

const content = ref("");

function onFileUpdate(files: File[]) {
  console.log(files);
}
</script>

<template>
  <div style="display: flex">
    <md-css-selector />
    <md-editor v-model="content" @files-update="onFileUpdate" :render-keys="['1']" />
    <md-render :content="content" key="1" />
  </div>
</template>

<style scope lang="less">
@import "./assets/css/common.css";
</style>
