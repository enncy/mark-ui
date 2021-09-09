<script setup lang="ts">
import {scrollBind} from '@/utils/dom';

const props = defineProps<{
  modelValue: any;
  renderKeys?: any[];
}>();

const emit = defineEmits<{
  (e: "update:modelValue", value: string): void;
  (e: "filesUpdate", files: File[]): void;
}>();
 

// 文件上传
function onDrop(e: DragEvent) {
  e.preventDefault();
  e.stopPropagation();
  if (e?.dataTransfer?.files) {
    // 遍历文件返回给父组件
    const filelist: FileList | undefined = e.dataTransfer.files;
    const files: File[] = [];
    for (let i = 0; i < filelist.length; i++) {
      const file: File | null = filelist.item(i);
      if (file !== null) {
        files.push(file);
      }
    }
    emit("filesUpdate", files);
  }
}

// 值变化
function onChange(e: Event) {
  emit("update:modelValue", (e?.target as HTMLTextAreaElement)?.value);
}
function onScroll(e:any){

}

 
</script>

<template>
  <textarea @drop="onDrop" @input="onChange" @scroll="onScroll"></textarea>
</template>

<style scope lang="less"></style>
