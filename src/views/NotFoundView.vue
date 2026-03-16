<script setup>
import { useRouter } from 'vue-router'
import { Home, ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
</script>

<template>
  <div class="notfound-container">
    <div class="glow-effect"></div>
    <div class="content">
      <h1 class="error-code">404</h1>
      <div class="divider"></div>
      <h2 class="error-title">Trang không tồn tại</h2>
      <p class="error-msg">
        Có vẻ như bạn đã đi lạc vào một vùng code chưa được biên dịch. <br />
        Hãy quay về trang chủ để tiếp tục hành trình của mình.
      </p>
      
      <div class="actions">
        <el-button type="primary" size="large" class="premium-btn" @click="router.push('/')">
          <Home :size="18" style="margin-right: 8px" />
          Về Trang Chủ
        </el-button>
        <el-button size="large" class="outline-btn" @click="router.back()">
          <ArrowLeft :size="18" style="margin-right: 8px" />
          Quay lại
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notfound-container {
  height: calc(100vh - 56px);
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--bg-primary);
  position: relative;
  overflow: hidden;
  text-align: center;
  padding: 24px;
}

.glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 161, 22, 0.05) 0%, transparent 70%);
  z-index: 0;
}

.content {
  position: relative;
  z-index: 1;
  max-width: 500px;
}

.error-code {
  font-size: 150px;
  font-weight: 900;
  line-height: 1;
  margin: 0;
  background: linear-gradient(135deg, #ffa116 0%, #ff8800 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -5px;
}

.divider {
  width: 60px;
  height: 4px;
  background-color: var(--border-primary);
  margin: 24px auto;
  border-radius: 2px;
}

.error-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.error-msg {
  font-size: 16px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 40px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.premium-btn {
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #ffa116 0%, #ff8800 100%);
  color: #000;
  transition: all 0.3s;
}

.premium-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(255, 161, 22, 0.3);
}

.outline-btn {
  height: 48px;
  padding: 0 24px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.outline-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}
</style>
