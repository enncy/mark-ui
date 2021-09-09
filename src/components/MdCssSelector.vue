<script setup lang="ts">
import { HljsCssTypes } from "@/core/types/hljs-css-types";
import { render } from "@vue/runtime-dom";

import hljsCss from "@/config/hljs-css.json";

const cssKeys: string[] = hljsCss.styles;


function onSelect(e:Event){
    console.log((e.target as any).value);
    
}
</script>

<template>
  <select   @change="onSelect"> 
    <option v-for="css of cssKeys" :value="css" :selected="css==='default'">{{css}}</option>
  </select>
</template>

<style scope lang="less"></style>
