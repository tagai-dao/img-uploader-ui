import { ref } from 'vue'
import axios from 'axios'

export interface UploadItem {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  url: string
  previewUrl: string
  errorMsg: string
}

export interface UploadHistory {
  url: string
  name: string
  time: number
}

const UPLOAD_BASE = 'https://upload.wormhole3.io/files/upload'
const UPLOAD_PATH = 'tiptag'
const UPLOAD_BUCKET = 'tiptag'
const HISTORY_KEY = 'img-uploader-history'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}


export function useUploadImg() {
  const uploadList = ref<UploadItem[]>([])
  const history = ref<UploadHistory[]>(loadHistory())

  function loadHistory(): UploadHistory[] {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
    } catch {
      return []
    }
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.value))
  }

  function addFiles(files: File[]) {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'))
    const items: UploadItem[] = imageFiles.map((file) => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      status: 'pending',
      progress: 0,
      url: '',
      previewUrl: URL.createObjectURL(file),
      errorMsg: '',
    }))
    uploadList.value.push(...items)
    items.forEach((item) => processUpload(item))
    return imageFiles.length
  }

  async function processUpload(item: UploadItem) {
    try {
      item.status = 'uploading'
      const ext = item.file.type.split('/')[1] || 'jpeg'
      const fileName = `${Date.now()}${Math.ceil(Math.random() * 1000)}.${ext}`
      const url = `${UPLOAD_BASE}?fileName=${fileName}&path=${UPLOAD_PATH}&bucket=${UPLOAD_BUCKET}`

      const formData = new FormData()
      formData.append('file', item.file)

      const res = await axios.put(url, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) {
            item.progress = Math.round((e.loaded / e.total) * 100)
          }
        },
      })

      item.url = res?.data ?? ''
      item.status = 'success'
      item.progress = 100

      history.value.unshift({
        url: item.url,
        name: item.name,
        time: Date.now(),
      })
      if (history.value.length > 100) {
        history.value = history.value.slice(0, 100)
      }
      saveHistory()
    } catch (err: any) {
      item.status = 'error'
      item.errorMsg = err?.message || '上传失败'
    }
  }

  async function uploadCroppedBlob(blob: Blob, originalName: string) {
    const id = generateId()
    const item: UploadItem = {
      id,
      file: new File([blob], originalName),
      name: originalName,
      size: blob.size,
      status: 'pending',
      progress: 0,
      url: '',
      previewUrl: URL.createObjectURL(blob),
      errorMsg: '',
    }
    uploadList.value.push(item)
    await processUpload(item)
  }

  function removeItem(id: string) {
    const idx = uploadList.value.findIndex((i) => i.id === id)
    if (idx !== -1) {
      URL.revokeObjectURL(uploadList.value[idx].previewUrl)
      uploadList.value.splice(idx, 1)
    }
  }

  function clearHistory() {
    history.value = []
    saveHistory()
  }

  function removeHistoryItem(index: number) {
    history.value.splice(index, 1)
    saveHistory()
  }

  return {
    uploadList,
    history,
    addFiles,
    uploadCroppedBlob,
    removeItem,
    clearHistory,
    removeHistoryItem,
  }
}
