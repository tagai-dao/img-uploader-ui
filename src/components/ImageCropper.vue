<script setup lang="ts">
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import { ref } from 'vue'

defineProps<{
  imgSrc: string | ArrayBuffer | null
}>()

const emit = defineEmits<{
  cancel: []
  confirm: [cropperRef: any]
}>()

const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null)
</script>

<template>
  <div class="flex flex-col">
    <div class="h-[400px] bg-gray-100">
      <VueCropper
        ref="cropperRef"
        :img="imgSrc as string"
        :autoCrop="true"
        :auto-crop-width="400"
        :auto-crop-height="400"
        :fixed="true"
        :centerBox="true"
        :enlarge="0.8"
        outputType="png"
        mode="cover"
      />
    </div>
    <div class="flex justify-center items-center gap-4 py-4">
      <el-button @click="emit('cancel')">取消</el-button>
      <el-button type="primary" @click="emit('confirm', cropperRef)">确认裁剪</el-button>
    </div>
  </div>
</template>
