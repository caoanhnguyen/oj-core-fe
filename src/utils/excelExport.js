import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export const exportStyledExcel = async ({
  title,       
  filename,    
  sheetName,   
  headers,     
  data,        
  columnWidths 
}) => {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Online Judge'
  workbook.created = new Date()
  
  const sheet = workbook.addWorksheet(sheetName || 'Sheet 1', {
    views: [{ state: 'frozen', ySplit: 4 }] // Freeze top 4 rows
  })

  // === Title Row ===
  const titleRow = sheet.addRow([title])
  titleRow.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2C2C2C' } }
  sheet.mergeCells(1, 1, 1, Math.max(headers.length, 3))
  titleRow.height = 36
  titleRow.alignment = { vertical: 'middle', horizontal: 'center' }

  // === Meta Row ===
  const metaRow = sheet.addRow([`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`])
  metaRow.font = { name: 'Arial', size: 11, italic: true, color: { argb: 'FF5A5A5A' } }
  sheet.mergeCells(2, 1, 2, Math.max(headers.length, 3))
  metaRow.height = 20
  metaRow.alignment = { vertical: 'middle', horizontal: 'right' }
  
  sheet.addRow([]) // spacer row 3

  // === Headers Row (Row 4) ===
  const headerRow = sheet.addRow(headers)
  headerRow.height = 28
  headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF00B8A3' } } // KMA green
    cell.border = {
      top: {style:'thin', color: {argb:'FFCCCCCC'}},
      left: {style:'thin', color: {argb:'FFCCCCCC'}},
      bottom: {style:'thin', color: {argb:'FFCCCCCC'}},
      right: {style:'thin', color: {argb:'FFCCCCCC'}}
    }
  })

  // === Data Rows ===
  data.forEach((rowData, index) => {
    const row = sheet.addRow(rowData)
    row.height = 22
    row.eachCell((cell) => {
      cell.font = { name: 'Arial', size: 11 }
      cell.border = {
        top: {style:'thin', color: {argb:'FFEEEEEE'}},
        left: {style:'thin', color: {argb:'FFEEEEEE'}},
        bottom: {style:'thin', color: {argb:'FFEEEEEE'}},
        right: {style:'thin', color: {argb:'FFEEEEEE'}}
      }
      cell.alignment = { vertical: 'middle' }
    })
    
    // Fill alternate rows for better readability
    if (index % 2 === 1) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9F9F9' } }
      })
    }
  })

  // === Column Widths ===
  if (columnWidths && columnWidths.length > 0) {
    sheet.columns.forEach((col, i) => {
      if (columnWidths[i]) col.width = columnWidths[i]
    })
  } else {
    sheet.columns.forEach(col => col.width = 15)
  }

  // === Download ===
  const buffer = await workbook.xlsx.writeBuffer()
  const fileNameFinal = filename.endsWith('.xlsx') ? filename : filename + '.xlsx'
  saveAs(new Blob([buffer]), fileNameFinal)
}
