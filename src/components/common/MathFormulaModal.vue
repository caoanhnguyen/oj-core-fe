<script setup>
import { ref, watch, nextTick, onMounted } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false }
})

const emit = defineEmits(['update:modelValue', 'insert'])

const latexInput = ref('')
const mathPreview = ref('')
const latexInputRef = ref(null)
let katexLib = null

onMounted(async () => {
  katexLib = (await import('katex')).default
})

watch(() => props.modelValue, (val) => {
  if (val) {
    latexInput.value = ''
    mathPreview.value = ''
    nextTick(() => latexInputRef.value?.focus())
  }
})

const close = () => emit('update:modelValue', false)

const updatePreview = () => {
  const eq = latexInput.value.trim()
  if (!eq) { mathPreview.value = ''; return }
  if (!katexLib) { mathPreview.value = `<code>${eq}</code>`; return }
  try {
    mathPreview.value = katexLib.renderToString(eq, { throwOnError: false, displayMode: true })
  } catch {
    mathPreview.value = `<span style="color:#ef4743;font-size:13px">Cú pháp không hợp lệ</span>`
  }
}

const handleInsert = () => {
  const eq = latexInput.value.trim()
  if (!eq) return
  emit('insert', eq)
  close()
}

const handleKey = (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleInsert() }
  if (e.key === 'Escape') close()
}

const appendLatex = (snippet) => {
  latexInput.value += snippet
  updatePreview()
  nextTick(() => latexInputRef.value?.focus())
}

const replaceLatex = (snippet) => {
  latexInput.value = snippet
  updatePreview()
  nextTick(() => latexInputRef.value?.focus())
}

// ── Collapsible — default all CLOSED, user opens what they want ──
const openGroups = ref(new Set())
const toggleGroup = (name) => {
  if (openGroups.value.has(name)) {
    openGroups.value.delete(name)
  } else {
    openGroups.value.add(name)
  }
}
const isOpen = (name) => openGroups.value.has(name)

// ── Templates ──
const templates = [
  { sym: 'a/b',   latex: '\\frac{a}{b}' },
  { sym: '√x',    latex: '\\sqrt{x}' },
  { sym: 'ⁿ√x',  latex: '\\sqrt[n]{x}' },
  { sym: 'Σᵢ',   latex: '\\sum_{i=1}^{n} a_i' },
  { sym: '∏ᵢ',   latex: '\\prod_{i=1}^{n} a_i' },
  { sym: '∫dx',   latex: '\\int_{a}^{b} f(x)\\,dx' },
  { sym: 'lim',   latex: '\\lim_{x \\to \\infty} f(x)' },
  { sym: 'df/dx', latex: '\\frac{df}{dx}' },
  { sym: '∂f/∂x', latex: '\\frac{\\partial f}{\\partial x}' },
  { sym: 'x=±',   latex: 'x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}' },
  { sym: '[2×2]', latex: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
  { sym: '{ f }', latex: '\\begin{cases} f(x) & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}' },
  { sym: 'Cₙᵏ',  latex: '\\binom{n}{k}' },
  { sym: 'logᵦ', latex: '\\log_{b}(x)' },
  { sym: 'eˣ',   latex: 'e^{x}' },
]

// ── Symbol groups ──
const toolbarGroups = [
  {
    name: 'Quan hệ',
    symbols: [
      { sym: '≥',   latex: ' \\geq ',      title: '≥ Lớn hơn hoặc bằng' },
      { sym: '≤',   latex: ' \\leq ',      title: '≤ Nhỏ hơn hoặc bằng' },
      { sym: '≠',   latex: ' \\neq ',      title: '≠ Khác' },
      { sym: '≈',   latex: ' \\approx ',   title: '≈ Xấp xỉ' },
      { sym: '∼',   latex: ' \\sim ',      title: '∼ Tương đương' },
      { sym: '≡',   latex: ' \\equiv ',    title: '≡ Đồng dư' },
      { sym: '≪',   latex: ' \\ll ',       title: '≪ Nhỏ hơn nhiều' },
      { sym: '≫',   latex: ' \\gg ',       title: '≫ Lớn hơn nhiều' },
    ]
  },
  {
    name: 'Số học',
    symbols: [
      { sym: '+',   latex: '+',          title: 'Cộng' },
      { sym: '−',   latex: '-',          title: 'Trừ' },
      { sym: '±',   latex: ' \\pm ',     title: '± Cộng trừ' },
      { sym: '∓',   latex: ' \\mp ',     title: '∓ Trừ cộng' },
      { sym: '×',   latex: ' \\times ',  title: '× Nhân' },
      { sym: '÷',   latex: ' \\div ',    title: '÷ Chia' },
      { sym: '·',   latex: ' \\cdot ',   title: '· Chấm nhân' },
      { sym: '|x|', latex: '|x|',        title: 'Trị tuyệt đối' },
      { sym: 'n!',  latex: 'n!',         title: 'Giai thừa' },
    ]
  },
  {
    name: 'Mũ & Chỉ số',
    symbols: [
      { sym: 'x²',  latex: '^{2}',   title: 'Bình phương' },
      { sym: 'x³',  latex: '^{3}',   title: 'Lập phương' },
      { sym: 'xⁿ',  latex: '^{n}',   title: 'Mũ n' },
      { sym: 'xᵢ',  latex: '_{i}',   title: 'Chỉ số i' },
      { sym: 'xₙ',  latex: '_{n}',   title: 'Chỉ số n' },
      { sym: 'x⁻¹', latex: '^{-1}',  title: 'Nghịch đảo' },
    ]
  },
  {
    name: 'Hằng số & Số học',
    symbols: [
      { sym: 'π',  latex: '\\pi',         title: 'Pi' },
      { sym: 'e',  latex: 'e',            title: 'Euler' },
      { sym: '∞',  latex: '\\infty',      title: 'Vô cực' },
      { sym: 'i',  latex: 'i',            title: 'Đơn vị ảo' },
      { sym: 'ℝ',  latex: '\\mathbb{R}',  title: 'Tập số thực' },
      { sym: 'ℤ',  latex: '\\mathbb{Z}',  title: 'Tập số nguyên' },
      { sym: 'ℕ',  latex: '\\mathbb{N}',  title: 'Tập số tự nhiên' },
      { sym: 'ℂ',  latex: '\\mathbb{C}',  title: 'Tập số phức' },
      { sym: 'ℚ',  latex: '\\mathbb{Q}',  title: 'Tập số hữu tỉ' },
    ]
  },
  {
    name: 'Tập hợp & Logic',
    symbols: [
      { sym: '∈',  latex: ' \\in ',            title: '∈ Thuộc' },
      { sym: '∉',  latex: ' \\notin ',         title: '∉ Không thuộc' },
      { sym: '⊂',  latex: ' \\subset ',        title: '⊂ Tập con' },
      { sym: '⊆',  latex: ' \\subseteq ',      title: '⊆ Tập con hoặc bằng' },
      { sym: '∪',  latex: ' \\cup ',           title: '∪ Hợp' },
      { sym: '∩',  latex: ' \\cap ',           title: '∩ Giao' },
      { sym: '∅',  latex: ' \\emptyset ',      title: '∅ Tập rỗng' },
      { sym: '∀',  latex: ' \\forall ',        title: '∀ Với mọi' },
      { sym: '∃',  latex: ' \\exists ',        title: '∃ Tồn tại' },
      { sym: '¬',  latex: ' \\neg ',           title: '¬ Phủ định' },
      { sym: '∧',  latex: ' \\land ',          title: '∧ Và' },
      { sym: '∨',  latex: ' \\lor ',           title: '∨ Hoặc' },
      { sym: '⇒',  latex: ' \\Rightarrow ',    title: '⇒ Suy ra' },
      { sym: '⟺', latex: ' \\Leftrightarrow ', title: '⟺ Tương đương' },
    ]
  },
  {
    name: 'Giải tích',
    symbols: [
      { sym: '∫',   latex: '\\int',      title: '∫ Tích phân' },
      { sym: '∬',   latex: '\\iint',     title: '∬ Tích phân 2 lần' },
      { sym: '∑',   latex: '\\sum',      title: '∑ Sigma' },
      { sym: '∏',   latex: '\\prod',     title: '∏ Tích Pi' },
      { sym: '∂',   latex: '\\partial',  title: '∂ Đạo hàm riêng' },
      { sym: '∇',   latex: '\\nabla',    title: '∇ Nabla' },
      { sym: "f'",  latex: "f'(x)",      title: "f' Đạo hàm" },
      { sym: 'f″',  latex: "f''(x)",     title: 'f″ Đạo hàm cấp 2' },
    ]
  },
  {
    name: 'Lượng giác',
    symbols: [
      { sym: 'sin',   latex: '\\sin',    title: 'sin' },
      { sym: 'cos',   latex: '\\cos',    title: 'cos' },
      { sym: 'tan',   latex: '\\tan',    title: 'tan' },
      { sym: 'cot',   latex: '\\cot',    title: 'cot' },
      { sym: 'sin⁻¹', latex: '\\arcsin', title: 'arcsin' },
      { sym: 'cos⁻¹', latex: '\\arccos', title: 'arccos' },
      { sym: 'tan⁻¹', latex: '\\arctan', title: 'arctan' },
      { sym: '°',     latex: '^{\\circ}', title: 'Độ' },
    ]
  },
  {
    name: 'Vector & Ma trận',
    symbols: [
      { sym: '→v',  latex: '\\vec{v}',        title: '→ Vector' },
      { sym: '‖v‖', latex: '\\|\\vec{v}\\|',  title: '‖v‖ Chuẩn' },
      { sym: '·',   latex: ' \\cdot ',         title: '· Tích vô hướng' },
      { sym: '×',   latex: ' \\times ',        title: '× Tích có hướng' },
      { sym: 'ᵀ',   latex: '^{T}',            title: 'ᵀ Chuyển vị' },
      { sym: 'det', latex: '\\det',            title: 'det Định thức' },
    ]
  },
]
</script>

<template>
  <Teleport to="body">
    <Transition name="mf-fade">
      <div v-if="modelValue" class="mf-overlay" @click.self="close">
        <div class="mf-modal">

          <!-- ── Header ── -->
          <div class="mf-header">
            <span class="mf-title">
              <span class="mf-icon">∑</span> Công thức toán học
            </span>
            <button class="mf-close" type="button" @click="close">✕</button>
          </div>

          <!-- ── Symbol toolbar (FIXED height, scroll inside) ── -->
          <div class="mf-toolbar">

            <!-- Templates always visible -->
            <div class="mf-section-header mf-section-header--plain">Mẫu công thức</div>
            <div class="mf-chips">
              <button
                v-for="t in templates"
                :key="t.latex"
                class="mf-chip mf-chip--tpl"
                type="button"
                :title="t.sym"
                @click="replaceLatex(t.latex)"
              >{{ t.sym }}</button>
            </div>

            <div class="mf-divider" />

            <!-- Collapsible groups -->
            <div v-for="group in toolbarGroups" :key="group.name" class="mf-group">
              <!-- Group header — always visible, click to expand DOWN -->
              <button
                class="mf-section-header mf-section-header--toggle"
                type="button"
                @click="toggleGroup(group.name)"
              >
                <span>{{ group.name }}</span>
                <span class="mf-arrow" :class="{ open: isOpen(group.name) }">▾</span>
              </button>

              <!-- Chips expand downward using CSS grid trick (no Transition needed) -->
              <div class="mf-collapse" :class="{ 'mf-collapse--open': isOpen(group.name) }">
                <div class="mf-collapse-inner">
                  <div class="mf-chips mf-chips--group">
                    <button
                      v-for="s in group.symbols"
                      :key="s.sym + s.latex"
                      class="mf-chip"
                      type="button"
                      :title="s.title"
                      @click="appendLatex(s.latex)"
                    >{{ s.sym }}</button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- ── LaTeX input (full width) ── -->
          <div class="mf-bottom">
            <div class="mf-input-wrap">
              <label class="mf-label">LaTeX</label>
              <textarea
                ref="latexInputRef"
                v-model="latexInput"
                class="mf-latex"
                placeholder="Nhập hoặc chọn mẫu / ký hiệu bên trên...  (Enter để chèn)"
                rows="3"
                @input="updatePreview"
                @keydown="handleKey"
              />
            </div>
            <div class="mf-preview-wrap">
              <label class="mf-label">Xem trước</label>
              <div class="mf-preview">
                <div v-if="mathPreview" class="mf-preview-inner" v-html="mathPreview" />
                <span v-else class="mf-preview-hint">Nhập LaTeX để xem trước công thức...</span>
              </div>
            </div>
          </div>

          <!-- ── Footer ── -->
          <div class="mf-footer">
            <button class="mf-btn-cancel" type="button" @click="close">Hủy</button>
            <button
              class="mf-btn-insert"
              type="button"
              :disabled="!latexInput.trim()"
              @click="handleInsert"
            >Chèn công thức</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.mf-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .75);
  backdrop-filter: blur(5px);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

/* ── Modal shell ── */
.mf-modal {
  background: #1c1c1c;
  border: 1px solid #333;
  border-radius: 14px;
  width: 100%;
  max-width: 820px;
  display: flex;
  flex-direction: column;
  /* Total modal height is driven by content; we cap it */
  max-height: 90vh;
  box-shadow: 0 32px 100px rgba(0, 0, 0, .9);
  overflow: hidden;
}

/* ── Header ── */
.mf-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 22px;
  border-bottom: 1px solid #2a2a2a;
  background: #222;
  flex-shrink: 0;
}
.mf-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  color: #eff2f6;
}
.mf-icon { font-size: 20px; color: #ffa116; }
.mf-close {
  background: transparent;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 9px;
  border-radius: 6px;
  transition: all .15s;
}
.mf-close:hover { background: #2e2e2e; color: #eee; }

/* ── Toolbar — FIXED height, scroll only inside ── */
.mf-toolbar {
  /* Exactly 260px visible; expanding groups scroll inside this box */
  height: 260px;
  min-height: 260px;
  max-height: 260px;
  overflow-y: auto;
  padding: 12px 18px;
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
  flex-grow: 0;
  border-bottom: 1px solid #2a2a2a;
}
.mf-toolbar::-webkit-scrollbar { width: 6px; }
.mf-toolbar::-webkit-scrollbar-thumb { background: #383838; border-radius: 3px; }
.mf-toolbar::-webkit-scrollbar-track { background: transparent; }

/* Section headers */
.mf-section-header {
  font-size: 12px;
  font-weight: 700;
  color: #ffa116;
  letter-spacing: .4px;
  padding: 6px 0 4px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.mf-section-header--plain {
  user-select: none;
}
.mf-section-header--toggle {
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
  border-radius: 6px;
  padding: 7px 8px;
  margin: 2px 0;
  transition: background .12s;
  color: #ffa116;
}
.mf-section-header--toggle:hover {
  background: rgba(255, 161, 22, .07);
}

.mf-arrow {
  font-size: 13px;
  color: #666;
  transition: transform .2s;
  display: inline-block;
}
.mf-arrow.open { transform: rotate(0deg); }
/* By default (closed) the arrow points right-ish; when open, down */
.mf-arrow:not(.open) { transform: rotate(-90deg); }

/* ── Chips container ── */
.mf-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 4px 2px 10px;
}
.mf-chips--group {
  padding: 6px 8px 10px;
  background: #1a1a1a;
  border-radius: 0 0 6px 6px;
  border: 1px solid #2a2a2a;
  border-top: none;
  margin-bottom: 4px;
}

/* ── Collapse via CSS grid trick ── */
.mf-collapse {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows .22s ease;
}
/* This wrapper MUST have overflow:hidden + min-height:0 to collapse to true 0 */
.mf-collapse-inner {
  overflow: hidden;
  min-height: 0;
}
.mf-collapse--open {
  grid-template-rows: 1fr;
}

/* ── Chip buttons ── */
.mf-chip {
  background: #282828;
  border: 1px solid #363636;
  border-radius: 6px;
  color: #d0d0d0;
  font-size: 15px;
  padding: 5px 12px;
  min-width: 38px;
  cursor: pointer;
  transition: all .12s;
  white-space: nowrap;
  text-align: center;
  line-height: 1.5;
}
.mf-chip:hover {
  background: #2f2f2f;
  border-color: #4a4a4a;
  color: #fff;
}
.mf-chip:active {
  background: rgba(255, 161, 22, .18);
  border-color: rgba(255, 161, 22, .5);
  color: #ffa116;
}

/* Template chips slightly styled differently */
.mf-chip--tpl {
  background: #232323;
  border-color: #303030;
  font-size: 13px;
  color: #b0b0b0;
}
.mf-chip--tpl:hover {
  border-color: rgba(255, 161, 22, .5);
  color: #ffa116;
  background: rgba(255, 161, 22, .08);
}

.mf-divider {
  height: 1px;
  background: #2a2a2a;
  margin: 8px 0;
  flex-shrink: 0;
}

/* ── Bottom: LaTeX + Preview ── */
.mf-bottom {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex-shrink: 0;
}

.mf-input-wrap,
.mf-preview-wrap {
  padding: 12px 20px;
  border-top: 1px solid #252525;
}

.mf-label {
  display: block;
  font-size: 11px;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: .8px;
  margin-bottom: 7px;
}

.mf-latex {
  width: 100%;
  background: #111;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  color: #e0e0e0;
  font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
  font-size: 14px;
  padding: 10px 14px;
  resize: vertical;
  outline: none;
  transition: border-color .2s, box-shadow .2s;
  box-sizing: border-box;
  min-height: 72px;
}
.mf-latex:focus {
  border-color: rgba(255, 161, 22, .5);
  box-shadow: 0 0 0 2px rgba(255, 161, 22, .07);
}
.mf-latex::placeholder { color: #3c3c3c; font-style: italic; }

.mf-preview {
  background: #111;
  border: 1px solid #2e2e2e;
  border-radius: 8px;
  padding: 14px 18px;
  min-height: 56px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-x: auto;
}
.mf-preview-inner {
  color: #e0e0e0;
  width: 100%;
  overflow-x: auto;
}
.mf-preview-hint {
  color: #3a3a3a;
  font-style: italic;
  font-size: 13px;
}

/* ── Footer ── */
.mf-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 13px 20px;
  border-top: 1px solid #2a2a2a;
  background: #222;
  flex-shrink: 0;
}
.mf-btn-cancel {
  background: transparent;
  border: 1px solid #333;
  border-radius: 8px;
  color: #888;
  font-size: 14px;
  padding: 8px 20px;
  cursor: pointer;
  transition: all .15s;
}
.mf-btn-cancel:hover { background: #2a2a2a; color: #eee; }

.mf-btn-insert {
  background: linear-gradient(135deg, #ffa116, #e6900d);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 700;
  padding: 8px 24px;
  cursor: pointer;
  transition: all .2s;
}
.mf-btn-insert:hover:not(:disabled) {
  background: linear-gradient(135deg, #ffb733, #ffa116);
  box-shadow: 0 4px 18px rgba(255, 161, 22, .38);
}
.mf-btn-insert:disabled { opacity: .35; cursor: not-allowed; }

/* ── Animations ── */
.mf-fade-enter-active, .mf-fade-leave-active { transition: all .2s ease; }
.mf-fade-enter-from, .mf-fade-leave-to { opacity: 0; transform: scale(.95) translateY(-12px); }
</style>

<style>
/* KaTeX dark theme — global */
.mf-preview-inner .katex,
.mf-preview-inner .katex-display { color: #e0e0e0 !important; }
.mf-preview-inner .katex-display { margin: 0 !important; }
</style>
