<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../composables/useAuth'

const { login, loginLoading, loginError } = useAuth()

const name = ref('')
const password = ref('')

async function handleLogin() {
  if (!name.value.trim() || !password.value.trim()) {
    return
  }
  await login(name.value.trim(), password.value.trim())
}
</script>

<template>
  <div class="login-wrapper">
    <div class="login-card">
      <div class="login-logo">
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="12" fill="url(#grad)" />
          <path d="M12 20L18 26L28 14" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
              <stop stop-color="#6366f1"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <h1 class="login-title">TagAI Image Uploader</h1>
      <p class="login-sub">请登录以继续</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field-group">
          <label class="field-label">账号</label>
          <input
            v-model="name"
            type="text"
            class="field-input"
            placeholder="请输入账号"
            autocomplete="username"
            :disabled="loginLoading"
          />
        </div>
        <div class="field-group">
          <label class="field-label">密码</label>
          <input
            v-model="password"
            type="password"
            class="field-input"
            placeholder="请输入密码"
            autocomplete="current-password"
            :disabled="loginLoading"
          />
        </div>

        <div v-if="loginError" class="login-error">{{ loginError }}</div>

        <button class="login-btn" type="submit" :disabled="loginLoading || !name || !password">
          <span v-if="loginLoading" class="loading-spinner"></span>
          <span>{{ loginLoading ? '登录中...' : '登 录' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f0f4ff 0%, #f5f0ff 100%);
  padding: 16px;
}

.login-card {
  background: #fff;
  border-radius: 20px;
  padding: 48px 40px 40px;
  width: 100%;
  max-width: 400px;
  box-shadow:
    0 4px 6px -1px rgba(99, 102, 241, 0.08),
    0 20px 60px -10px rgba(99, 102, 241, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-logo {
  margin-bottom: 20px;
  filter: drop-shadow(0 4px 12px rgba(99, 102, 241, 0.3));
}

.login-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e1b4b;
  margin: 0 0 6px;
  letter-spacing: -0.3px;
}

.login-sub {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 32px;
}

.login-form {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.field-input {
  height: 44px;
  padding: 0 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 0.9375rem;
  color: #111827;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: #fafafa;
}

.field-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  background: #fff;
}

.field-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.login-error {
  font-size: 0.8125rem;
  color: #ef4444;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 8px 12px;
  text-align: center;
}

.login-btn {
  height: 46px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
  box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
  letter-spacing: 0.5px;
}

.login-btn:hover:not(:disabled) {
  opacity: 0.92;
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
}

.login-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.login-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
