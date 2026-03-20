<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled, CopyDocument, Delete, Crop, Clock } from '@element-plus/icons-vue'
import ImageCropper from './components/ImageCropper.vue'
import { useUploadImg } from './composables/useUploadImg'

const {
  uploadList,
  history,
  addFiles,
  uploadCroppedBlob,
  removeItem,
  clearHistory,
  removeHistoryItem,
} = useUploadImg()

const isDragging = ref(false)
const showCropper = ref(false)
const cropperImgSrc = ref<string | ArrayBuffer | null>(null)
const cropperFileName = ref('')
const showHistory = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const successCount = computed(() => uploadList.value.filter((i) => i.status === 'success').length)
const totalCount = computed(() => uploadList.value.length)

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files?.length) {
    const count = addFiles(Array.from(input.files))
    if (count === 0) {
      ElMessage.warning('请选择图片文件')
    }
    input.value = ''
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files?.length) {
    const count = addFiles(Array.from(files))
    if (count === 0) {
      ElMessage.warning('请选择图片文件')
    }
  }
}

function openCropper(item: { file: File; name: string }) {
  const reader = new FileReader()
  reader.readAsDataURL(item.file)
  reader.onload = (res) => {
    cropperImgSrc.value = res.target?.result ?? null
    cropperFileName.value = item.name
    showCropper.value = true
  }
}

function onCropConfirm(cropperRef: any) {
  cropperRef?.getCropBlob((blob: Blob) => {
    showCropper.value = false
    uploadCroppedBlob(blob, cropperFileName.value)
  })
}

async function copyUrl(url: string) {
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success('已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

function copyAllUrls() {
  const urls = uploadList.value
    .filter((i) => i.status === 'success')
    .map((i) => i.url)
    .join('\n')
  if (!urls) {
    ElMessage.warning('没有已上传的图片')
    return
  }
  navigator.clipboard.writeText(urls).then(
    () => ElMessage.success(`已复制 ${successCount.value} 个链接`),
    () => ElMessage.error('复制失败')
  )
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 py-8 px-4">
    <div class="max-w-3xl mx-auto">
      <!-- Header -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">TagAI Image Uploader</h1>
        <p class="text-gray-500">拖拽或选择图片上传，支持批量上传</p>
      </div>

      <!-- Upload Area -->
      <div
        class="border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 mb-6"
        :class="isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-white hover:border-blue-400 hover:bg-gray-50'"
        @dragover.prevent="isDragging = true"
        @dragleave="isDragging = false"
        @drop.prevent="onDrop"
        @click="fileInput?.click()"
      >
        <el-icon :size="48" class="text-gray-400 mb-4"><UploadFilled /></el-icon>
        <p class="text-lg text-gray-600 mb-2">将图片拖拽到此处，或点击选择</p>
        <p class="text-sm text-gray-400">支持 JPG、PNG、GIF、WebP 等格式，可多选</p>
        <input
          ref="fileInput"
          type="file"
          accept="image/*"
          multiple
          class="hidden"
          @change="onFileChange"
        />
      </div>

      <!-- Action Bar -->
      <div class="flex justify-between items-center mb-4" v-if="uploadList.length > 0 || history.length > 0">
        <div class="flex items-center gap-3">
          <span class="text-sm text-gray-500" v-if="totalCount > 0">
            {{ successCount }}/{{ totalCount }} 已上传
          </span>
          <el-button size="small" type="primary" plain @click="copyAllUrls" v-if="successCount > 0">
            复制全部链接
          </el-button>
        </div>
        <el-button
          size="small"
          :type="showHistory ? 'primary' : 'default'"
          plain
          @click="showHistory = !showHistory"
          v-if="history.length > 0"
        >
          <el-icon class="mr-1"><Clock /></el-icon>
          历史记录 ({{ history.length }})
        </el-button>
      </div>

      <!-- Upload List -->
      <div class="space-y-3" v-if="uploadList.length > 0">
        <div
          v-for="item in uploadList"
          :key="item.id"
          class="bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex items-center gap-4"
        >
          <!-- Thumbnail -->
          <div class="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-gray-100">
            <img
              :src="item.previewUrl"
              :alt="item.name"
              class="w-full h-full object-cover"
            />
          </div>

          <!-- Info -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <span class="text-sm font-medium text-gray-700 truncate">{{ item.name }}</span>
              <span class="text-xs text-gray-400">{{ formatSize(item.size) }}</span>
            </div>

            <!-- Progress -->
            <el-progress
              v-if="item.status === 'uploading'"
              :percentage="item.progress"
              :stroke-width="4"
              class="mb-1"
            />
            <div v-if="item.status === 'compressing'" class="text-xs text-blue-500">压缩中...</div>
            <div v-if="item.status === 'error'" class="text-xs text-red-500">{{ item.errorMsg }}</div>

            <!-- URL -->
            <div v-if="item.status === 'success'" class="flex items-center gap-2">
              <input
                :value="item.url"
                readonly
                class="flex-1 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none"
                @click="($event.target as HTMLInputElement).select()"
              />
              <el-button size="small" :icon="CopyDocument" circle @click="copyUrl(item.url)" />
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-1 shrink-0">
            <el-button
              v-if="item.status === 'success' || item.status === 'pending'"
              size="small"
              :icon="Crop"
              circle
              @click.stop="openCropper(item)"
              title="裁剪后上传"
            />
            <el-button
              size="small"
              :icon="Delete"
              circle
              type="danger"
              plain
              @click="removeItem(item.id)"
            />
          </div>
        </div>
      </div>

      <!-- History -->
      <div v-if="showHistory && history.length > 0" class="mt-6">
        <div class="flex justify-between items-center mb-3">
          <h3 class="text-base font-semibold text-gray-700">上传历史</h3>
          <el-button size="small" type="danger" plain @click="clearHistory">清空历史</el-button>
        </div>
        <div class="bg-white rounded-lg shadow-sm border border-gray-100 divide-y divide-gray-50">
          <div
            v-for="(h, idx) in history"
            :key="idx"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="w-10 h-10 rounded overflow-hidden shrink-0 bg-gray-100">
              <img :src="h.url" :alt="h.name" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <div class="text-sm text-gray-700 truncate">{{ h.name }}</div>
              <div class="text-xs text-gray-400">{{ formatTime(h.time) }}</div>
            </div>
            <input
              :value="h.url"
              readonly
              class="w-48 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none"
              @click="($event.target as HTMLInputElement).select()"
            />
            <el-button size="small" :icon="CopyDocument" circle @click="copyUrl(h.url)" />
            <el-button size="small" :icon="Delete" circle plain @click="removeHistoryItem(idx)" />
          </div>
        </div>
      </div>

      <!-- Cropper Dialog -->
      <el-dialog v-model="showCropper" title="裁剪图片" width="500px" :close-on-click-modal="false">
        <ImageCropper
          :imgSrc="cropperImgSrc"
          @cancel="showCropper = false"
          @confirm="onCropConfirm"
        />
      </el-dialog>
    </div>
  </div>
</template>
