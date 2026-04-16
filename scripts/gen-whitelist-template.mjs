/**
 * One-time script to generate whitelist import template Excel file.
 * Run: node scripts/gen-whitelist-template.mjs
 * Output: public/templates/Bieu_Mau_Danh_Sach_Ung_Vien.xlsx
 */
import ExcelJS from 'exceljs'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(__dirname, '../public/templates')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

const workbook = new ExcelJS.Workbook()
workbook.creator = 'OJ Core System'
workbook.created = new Date()

const sheet = workbook.addWorksheet('Danh Sach Ung Vien', {
  pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true }
})

sheet.columns = [
  { key: 'stt',   width: 8  },
  { key: 'name',  width: 30 },
  { key: 'email', width: 38 },
  { key: 'phone', width: 18 },
  { key: 'note',  width: 28 },
]

// Row 1: System Banner
sheet.mergeCells('A1:E1')
const bannerCell = sheet.getCell('A1')
bannerCell.value = '\u2605  HE THONG DANH GIA NANG LUC  —  OJ CORE PLATFORM  \u2605'
bannerCell.font = { name: 'Calibri', bold: true, size: 13, color: { argb: 'FFFFFFFF' } }
bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A3A5C' } }
bannerCell.alignment = { horizontal: 'center', vertical: 'middle' }
sheet.getRow(1).height = 32

// Row 2: Form title
sheet.mergeCells('A2:E2')
const titleCell = sheet.getCell('A2')
titleCell.value = 'BIEU MAU NHAP DANH SACH UNG VIEN CONTEST (WHITELIST)'
titleCell.font = { name: 'Calibri', bold: true, size: 15, color: { argb: 'FF1A3A5C' } }
titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } }
titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
sheet.getRow(2).height = 36

// Row 3: Instructions
sheet.mergeCells('A3:E3')
const instrCell = sheet.getCell('A3')
instrCell.value = 'Huong dan: Dien thong tin ung vien bat dau tu dong so 6. Cot EMAIL la BAT BUOC. Khong xoa/them cot, khong doi tieu de cot.'
instrCell.font = { name: 'Calibri', italic: true, size: 10, color: { argb: 'FF7C3AED' } }
instrCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F3FF' } }
instrCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true }
sheet.getRow(3).height = 22

// Row 4: Spacer
sheet.mergeCells('A4:E4')
const spacerCell = sheet.getCell('A4')
spacerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
sheet.getRow(4).height = 8

// Row 5: Column headers
const headerDefs = [
  { col: 1, label: 'STT' },
  { col: 2, label: 'HO VA TEN' },
  { col: 3, label: 'EMAIL (*)' },
  { col: 4, label: 'SO DIEN THOAI' },
  { col: 5, label: 'GHI CHU' },
]
sheet.getRow(5).height = 30
headerDefs.forEach(({ col, label }) => {
  const cell = sheet.getCell(5, col)
  cell.value = label
  cell.font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FFFFFFFF' } }
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } }
  cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
  cell.border = {
    top:    { style: 'medium', color: { argb: 'FF1E3A8A' } },
    left:   { style: 'medium', color: { argb: 'FF1E3A8A' } },
    bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
    right:  { style: 'medium', color: { argb: 'FF1E3A8A' } },
  }
})

// Rows 6-25: Sample rows + blank rows
const sampleData = [
  ['1', 'Nguyen Van An', 'nguyen.van.an@gmail.com', '0901234567', ''],
  ['2', 'Tran Thi Biet', 'thi.biet@kma.edu.vn', '0987654321', ''],
]
for (let i = 0; i < 20; i++) {
  const rowIdx = 6 + i
  sheet.getRow(rowIdx).height = 22
  const isEven = i % 2 === 1
  const bgColor = isEven ? 'FFF0F4FF' : 'FFFFFFFF'
  const isSample = i < sampleData.length
  const values = isSample ? sampleData[i] : [String(i + 1), '', '', '', '']

  values.forEach((val, colIdx) => {
    const cell = sheet.getCell(rowIdx, colIdx + 1)
    cell.value = val
    cell.font = {
      name: 'Calibri', size: 11,
      color: { argb: isSample ? 'FF374151' : 'FF9CA3AF' },
      italic: !isSample
    }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
    cell.alignment = {
      horizontal: colIdx === 0 ? 'center' : 'left',
      vertical: 'middle'
    }
    cell.border = {
      top:    { style: 'thin', color: { argb: 'FFD1D5DB' } },
      left:   { style: 'thin', color: { argb: 'FFD1D5DB' } },
      bottom: { style: 'thin', color: { argb: 'FFD1D5DB' } },
      right:  { style: 'thin', color: { argb: 'FFD1D5DB' } },
    }
    if (colIdx === 2 && isSample) {
      cell.font = { name: 'Calibri', size: 11, color: { argb: 'FF1E40AF' }, bold: true }
    }
  })
}

// Row 27: Footer
sheet.mergeCells('A27:E27')
const footerCell = sheet.getCell('A27')
footerCell.value = 'OJ Core Platform  |  He thong danh gia nang luc  |  Lien he quan tri vien de duoc ho tro'
footerCell.font = { name: 'Calibri', size: 9, italic: true, color: { argb: 'FF9CA3AF' } }
footerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } }
footerCell.alignment = { horizontal: 'center', vertical: 'middle' }
sheet.getRow(27).height = 18

// Freeze panes
sheet.views = [{ state: 'frozen', ySplit: 5, activeCell: 'B6' }]

// Write
const outPath = path.join(outDir, 'Bieu_Mau_Danh_Sach_Ung_Vien.xlsx')
await workbook.xlsx.writeFile(outPath)
console.log(`Template generated: ${outPath}`)
