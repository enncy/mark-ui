<script setup lang="ts">
// This starter template is using Vue 3 <script setup> SFCs
// Check out https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup
import { onMounted, ref } from "vue";
import MdRender from "@/components/MdRender.vue";

// 自动滚动
function autoScroll(e: any) {
  const mdRender: any = document.querySelector(".markdown-body");
  // 计算有效高
  var validH = e?.target?.scrollHeight - e.target.clientHeight;
  const rate = e?.target?.scrollTop / validH;
  console.log(rate);
  console.log(mdRender.scrollHeight * rate);

  mdRender?.scrollTo({
    behavior: "auto",
    top: mdRender.scrollHeight * rate,
  });
}

const content = ref("");
</script>

<template>
  <div style="display: flex; ">
    <textarea v-model="content" @scroll="autoScroll"></textarea>
    <md-render :content="content" />
  </div>
</template>

<style scope lang="less">
@import "./assets/css/common.css";
</style>
