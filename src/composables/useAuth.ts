import { ref } from 'vue'
import axios from 'axios'

const AUTH_KEY = 'img-uploader-auth'
const LOGIN_URL = 'https://bsc-api.tagai.fun/tiptag/admin-login'

// Shared reactive state (singleton)
const isLoggedIn = ref<boolean>(!!localStorage.getItem(AUTH_KEY))
const loginLoading = ref(false)
const loginError = ref('')

export function useAuth() {
  async function login(name: string, password: string): Promise<boolean> {
    loginLoading.value = true
    loginError.value = ''
    try {
      const res = await axios.post(LOGIN_URL, { name, password })
      if (res.status === 200) {
        localStorage.setItem(AUTH_KEY, '1')
        isLoggedIn.value = true
        return true
      } else {
        loginError.value = '用户名或密码错误'
        return false
      }
    } catch (err: any) {
      if (err?.response?.status === 401 || err?.response?.status === 403) {
        loginError.value = '用户名或密码错误'
      } else {
        loginError.value = err?.response?.data?.message || '登录失败，请稍后重试'
      }
      return false
    } finally {
      loginLoading.value = false
    }
  }

  function logout() {
    localStorage.removeItem(AUTH_KEY)
    isLoggedIn.value = false
  }

  return {
    isLoggedIn,
    loginLoading,
    loginError,
    login,
    logout,
  }
}
