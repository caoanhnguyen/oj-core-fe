<script setup>
import { useRouter } from 'vue-router'
import { Rocket, Trophy, Code, Users, Search, ChevronRight } from 'lucide-vue-next'

const router = useRouter()

const features = [
  {
    icon: Code,
    title: 'Hệ thống chấm bài tự động',
    description: 'Hỗ trợ đa ngôn ngữ lập trình (C++, Java, Python, Go...) với tốc độ phản hồi cực nhanh.',
    color: '#ffa116'
  },
  {
    icon: Trophy,
    title: 'Kỳ thi & Xếp hạng',
    description: 'Tham gia các kỳ thi định kỳ và thử thách bản thân với hệ thống tính điểm chuẩn quốc tế.',
    color: '#00b8a3'
  },
  {
    icon: Users,
    title: 'Cộng đồng năng động',
    description: 'Thảo luận, chia sẻ kinh nghiệm giải bài và học hỏi từ các chuyên gia hàng đầu.',
    color: '#3b82f6'
  }
]

const stats = [
  { label: 'Bài tập', value: '500+' },
  { label: 'Người dùng', value: '1,200+' },
  { label: 'Bài nộp', value: '50,000+' }
]
</script>

<template>
  <div class="home-container">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <div class="hero-badge">
          <Rocket :size="14" />
          <span>Hệ thống Kiểm tra Đánh giá Năng lực Doanh nghiệp</span>
        </div>
        <h1 class="hero-title">
          Chinh phục đỉnh cao <br />
          <span class="gradient-text">Kỹ năng lập trình</span>
        </h1>
        <p class="hero-subtitle">
          DevAssess Enterprise cung cấp giải pháp toàn diện giúp doanh nghiệp đánh giá chính xác năng lực ứng viên và nâng cao chất lượng đội ngũ kỹ sư phần mềm.
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" class="premium-btn" @click="router.push('/problems')">
            Bắt đầu luyện tập
            <ChevronRight :size="18" style="margin-left: 8px" />
          </el-button>
          <el-button size="large" class="outline-btn" @click="router.push('/submissions')">
            Xem bảng tin bài nộp
          </el-button>
        </div>
      </div>

      <!-- Hero Visual Stats -->
      <div class="hero-stats">
        <div v-for="stat in stats" :key="stat.label" class="stat-card">
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section class="features-section">
      <div class="section-header">
        <h2 class="section-title">Tại sao chọn DevAssess Enterprise?</h2>
        <div class="section-line"></div>
      </div>
      
      <div class="feature-grid">
        <div v-for="feature in features" :key="feature.title" class="feature-card">
          <div class="feature-icon-box" :style="{ backgroundColor: feature.color + '20', color: feature.color }">
            <component :is="feature.icon" :size="32" />
          </div>
          <h3 class="feature-title">{{ feature.title }}</h3>
          <p class="feature-description">{{ feature.description }}</p>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section">
      <div class="cta-card">
        <div class="cta-content">
          <h2 class="cta-title">Sẵn sàng để bắt đầu chưa?</h2>
          <p class="cta-text">Tạo tài khoản ngay hôm nay để lưu trữ quá trình luyện tập và tham gia bảng xếp hạng.</p>
        </div>
        <el-button type="primary" size="large" class="premium-btn" @click="router.push('/register')">
          Đăng ký miễn phí
        </el-button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  padding-bottom: 80px;
}

/* Hero Section */
.hero-section {
  padding: 100px 24px 80px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -10%;
  left: 50%;
  transform: translateX(-50%);
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255, 161, 22, 0.08) 0%, transparent 70%);
  z-index: -1;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 161, 22, 0.1);
  color: var(--accent-primary);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  margin-bottom: 24px;
  border: 1px solid rgba(255, 161, 22, 0.2);
}

.hero-title {
  font-size: 64px;
  line-height: 1.1;
  font-weight: 800;
  color: #fff;
  margin-bottom: 24px;
  letter-spacing: -0.02em;
}

.gradient-text {
  background: linear-gradient(135deg, #ffa116 0%, #ff6b00 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-subtitle {
  font-size: 18px;
  color: var(--text-secondary);
  max-width: 600px;
  margin-bottom: 40px;
  line-height: 1.6;
}

.hero-actions {
  display: flex;
  gap: 16px;
  margin-bottom: 60px;
  justify-content: center;
}

.premium-btn {
  height: 54px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  border: none;
  background: linear-gradient(135deg, #ffa116 0%, #ff8800 100%);
  box-shadow: 0 4px 15px rgba(255, 161, 22, 0.3);
  transition: all 0.3s;
  color: #000;
}

.premium-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 161, 22, 0.4);
  background: linear-gradient(135deg, #ffb84d 0%, #ffa116 100%);
}

.outline-btn {
  height: 54px;
  padding: 0 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
}

.outline-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
}

/* Stats */
.hero-stats {
  display: flex;
  gap: 40px;
  margin-top: 20px;
}

.stat-card {
  text-align: center;
}

.stat-value {
  font-size: 32px;
  font-weight: 800;
  color: #fff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 1px;
}

/* Features Section */
.features-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 80px 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.section-line {
  width: 60px;
  height: 4px;
  background: var(--accent-primary);
  margin: 0 auto;
  border-radius: 2px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 32px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 40px 32px;
  border-radius: 24px;
  transition: all 0.3s;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.05);
  transform: translateY(-8px);
  border-color: rgba(255, 161, 22, 0.2);
}

.feature-icon-box {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.feature-title {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 16px;
}

.feature-description {
  font-size: 15px;
  color: var(--text-secondary);
  line-height: 1.6;
}

/* CTA Section */
.cta-section {
  max-width: 1200px;
  margin: 0 auto;
  padding: 60px 24px;
}

.cta-card {
  background: linear-gradient(135deg, rgba(255, 161, 22, 0.1) 0%, rgba(255, 107, 0, 0.05) 100%);
  border: 1px solid rgba(255, 161, 22, 0.2);
  border-radius: 32px;
  padding: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
}

.cta-title {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 12px;
}

.cta-text {
  font-size: 16px;
  color: var(--text-secondary);
  max-width: 500px;
}

@media (max-width: 992px) {
  .hero-title { font-size: 48px; }
  .feature-grid { grid-template-columns: 1fr; }
  .cta-card { flex-direction: column; text-align: center; padding: 40px; }
  .hero-stats { gap: 20px; flex-wrap: wrap; justify-content: center; }
}
</style>
