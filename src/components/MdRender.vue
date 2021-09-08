<script setup lang="ts">
// 导入的组件也可直接可用于模板(指令同理，同样会被自动注册)

import { computed,  ref, toRefs } from "vue";
import markdown from "@/plugins/markdown";

const props = defineProps({
  content: String,
});
const { content } = toRefs(props);
 
// 渲染 md
let result = computed(() => markdown.render(content?.value || ""));
 
</script>

<template>
  <div class="markdown-body"  v-html="result"></div>
  
</template>

<style scope lang="less"></style>
