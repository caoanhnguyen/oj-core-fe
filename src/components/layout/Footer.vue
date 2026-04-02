<script setup>
import { Code2, Github, Facebook, Mail } from 'lucide-vue-next'
</script>

<template>
  <footer class="main-footer">
    <div class="footer-content container">
      <div class="footer-left">
        <div class="footer-logo">
          <Code2 :size="24" class="logo-icon" />
          <span class="logo-text">KMA OJ</span>
        </div>
        <p class="footer-desc">
          Nền tảng luyện tập lập trình trực tuyến dành cho sinh viên Học viện Kỹ thuật Mật mã.
        </p>
        <div class="social-links">
          <a href="https://github.com/caoanhnguyen" class="social-link"><Github :size="20" /></a>
          <a href="https://www.facebook.com/cao.anh.nguyen.574932" class="social-link"><Facebook :size="20" /></a>
          <a href="mailto:[EMAIL_ADDRESS]" class="social-link"><Mail :size="20" /></a>
        </div>
      </div>
      
      <div class="footer-links">
        <div class="link-group">
          <h4 class="group-title">Nền tảng</h4>
          <RouterLink to="/problems" class="footer-link">Bài tập</RouterLink>
          <RouterLink to="/submissions" class="footer-link">Bài nộp</RouterLink>
          <a href="#" class="footer-link">Kỳ thi</a>
          <a href="#" class="footer-link">Bảng xếp hạng</a>
        </div>
        
        <div class="link-group">
          <h4 class="group-title">Hỗ trợ</h4>
          <a href="#" class="footer-link">Hướng dẫn</a>
          <a href="#" class="footer-link">Điều khoản</a>
          <a href="#" class="footer-link">Bảo mật</a>
          <a href="#" class="footer-link">Liên hệ</a>
        </div>
      </div>
    </div>
    
    <div class="footer-bottom container">
      <p>&copy; 2026 KMA OJ. Developed with ❤️ by 
        <a class="footer-link" href="https://github.com/caoanhnguyen">caoanh_ng.</a>
      </p>
    </div>
  </footer>
</template>

<style scoped>
.main-footer {
  background-color: #0d0d0d;
  border-top: 1px solid var(--border-primary);
  padding: 60px 24px 30px;
  margin-top: auto;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  gap: 60px;
  margin-bottom: 60px;
}

.footer-link {
  color: var(--text-secondary);
  font-size: 14px;
  transition: color 0.2s;
}

.link-group .footer-link {
  display: block;
  margin-bottom: 12px;
}

.footer-link:hover {
  color: var(--accent-primary);
}

.footer-left {
  max-width: 320px;
}

.footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
}

.logo-icon {
  color: var(--accent-primary);
}

.logo-text {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.5px;
}

.footer-desc {
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.social-links {
  display: flex;
  gap: 16px;
}

.social-link {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all 0.3s;
}

.social-link:hover {
  background: var(--accent-primary);
  color: #000;
  transform: translateY(-3px);
}

.footer-links {
  display: flex;
  gap: 80px;
}

.group-title {
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 20px;
}



.footer-bottom {
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
  color: var(--text-tertiary);
  font-size: 13px;
}

@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    gap: 40px;
  }
  .footer-links {
    gap: 40px;
    justify-content: space-between;
  }
}
</style>
