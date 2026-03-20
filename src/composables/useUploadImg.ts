import { ref } from 'vue'
import axios from 'axios'

export interface UploadItem {
  id: string
  file: File
  name: string
  size: number
  status: 'pending' | 'compressing' | 'uploading' | 'success' | 'error'
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

function compressImage(file: Blob, quality = 0.5, maxWidth = 600): Promise<Blob> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (e) => {
      const img = new Image()
      img.src = e.target?.result as string
      img.onload = () => {
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob && blob.size < file.size) {
              resolve(blob)
            } else {
              resolve(file)
            }
          },
          'image/jpeg',
          quality
        )
      }
    }
  })
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
      item.status = 'compressing'
      let compressed = await compressImage(item.file, 0.5, 600)
      if (compressed.size > 600 * 600) {
        compressed = await compressImage(compressed, 0.5, 600)
        if (compressed.size > 600 * 600) {
          item.status = 'error'
          item.errorMsg = '图片压缩后仍超过大小限制'
          return
        }
      }

      item.status = 'uploading'
      const ext = item.file.type.split('/')[1] || 'jpeg'
      const fileName = `${Date.now()}${Math.ceil(Math.random() * 1000)}.${ext}`
      const url = `${UPLOAD_BASE}?fileName=${fileName}&path=${UPLOAD_PATH}&bucket=${UPLOAD_BUCKET}`

      const formData = new FormData()
      formData.append('file', compressed)

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
