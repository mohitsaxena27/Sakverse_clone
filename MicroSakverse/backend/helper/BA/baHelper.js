// baHelper.js - All design, styling and generation logic

import ExcelJS from 'exceljs';
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  VerticalAlign, LevelFormat, PageBreak,
} from 'docx';

// ─── Color Palette ──────────────────────────────────────────────────────────

const COLORS = {
  navy:      '1F3864',
  teal:      '17375E',
  blue:      '2E75B6',
  lightBlue: 'D6E4F0',
  gold:      'C9A84C',
  green:     '375623',
  softGreen: 'E2EFDA',
  white:     'FFFFFF',
  textDark:  '212121',
};

// ─── Excel Generation ─────────────────────────────────────────────────────

const excelStyles = {
  font: (bold = false, color = COLORS.textDark, size = 10) => ({
    name: 'Arial',
    bold,
    color: { argb: 'FF' + color },
    size
  }),
  
  fill: (argb) => ({
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF' + argb }
  }),
  
  align: (h = 'left', wrap = true) => ({
    vertical: 'middle',
    horizontal: h,
    wrapText: wrap
  }),
  
  border: () => ({
    top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
    right: { style: 'thin', color: { argb: 'FFBFBFBF' } },
  }),
  
  applyRow: (row, bgColor, fontColor, bold = false, height = 20) => {
    row.height = height;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = excelStyles.fill(bgColor);
      cell.font = excelStyles.font(bold, fontColor);
      cell.alignment = excelStyles.align();
      cell.border = excelStyles.border();
    });
  }
};

function createExcelOverviewSheet(wb, data) {
  const overviewSheet = wb.addWorksheet('Overview', {
    views: [{ state: 'frozen', ySplit: 3 }],
  });
  overviewSheet.columns = [
    { key: 'field', width: 28 },
    { key: 'value', width: 90 },
  ];

  // Title
  overviewSheet.mergeCells('A1:B1');
  const titleCell = overviewSheet.getCell('A1');
  titleCell.value = '📦  MARKETPLACE – PROJECT OVERVIEW';
  titleCell.font = excelStyles.font(true, COLORS.white, 14);
  titleCell.fill = excelStyles.fill(COLORS.navy);
  titleCell.alignment = excelStyles.align('center');
  overviewSheet.getRow(1).height = 36;

  // Column headers
  const ovHdrRow = overviewSheet.getRow(2);
  ovHdrRow.values = ['', ''];
  ovHdrRow.height = 4;

  // Data rows
  const ovRows = [
    ['Project ID', String(data.id ?? '')],
    ['Executive Summary', data.executive_summary ?? ''],
  ];

  // Parse business_objectives
  const objLines = (data.business_objectives ?? '').split('\n');
  let currentSection = 'Business Objectives';
  const objBlocks = [];
  let buf = [];
  for (const line of objLines) {
    const heading = line.match(/^##\s+(.*)/);
    if (heading) {
      if (buf.length) objBlocks.push([currentSection, buf.join('\n').trim()]);
      currentSection = heading[1];
      buf = [];
    } else {
      const clean = line.replace(/^\s*[-*]\s*/, '• ').replace(/\*\*/g, '');
      if (clean.trim()) buf.push(clean);
    }
  }
  if (buf.length) objBlocks.push([currentSection, buf.join('\n').trim()]);

  let rowIdx = 3;
  const ovColHdr = overviewSheet.getRow(rowIdx++);
  ovColHdr.values = ['Field', 'Details'];
  excelStyles.applyRow(ovColHdr, COLORS.blue, COLORS.white, true, 22);

  for (const [field, value] of [...ovRows, ...objBlocks]) {
    const r = overviewSheet.getRow(rowIdx++);
    r.getCell(1).value = field;
    r.getCell(2).value = value;
    const bg = rowIdx % 2 === 0 ? COLORS.lightBlue : COLORS.white;
    excelStyles.applyRow(r, bg, COLORS.textDark, false, field === 'Executive Summary' ? 60 : 50);
    r.getCell(1).font = excelStyles.font(true, COLORS.navy);
  }
}

function createExcelSummarySheet(wb, data) {
  const summarySheet = wb.addWorksheet('Features Summary', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });
  summarySheet.columns = [
    { key: 'id', width: 10 },
    { key: 'feature', width: 70 },
    { key: 'stories', width: 14 },
  ];

  summarySheet.mergeCells('A1:C1');
  const sumTitle = summarySheet.getCell('A1');
  sumTitle.value = 'ALL FEATURES';
  sumTitle.font = excelStyles.font(true, COLORS.white, 12);
  sumTitle.fill = excelStyles.fill(COLORS.navy);
  sumTitle.alignment = excelStyles.align('center');
  summarySheet.getRow(1).height = 30;

  const sumHdr = summarySheet.getRow(2);
  sumHdr.values = ['Feature ID', 'Core Feature', 'User Stories'];
  excelStyles.applyRow(sumHdr, COLORS.blue, COLORS.white, true, 22);

  let si = 3;
  for (const feat of (data.feature_breackdown ?? [])) {
    const r = summarySheet.getRow(si++);
    r.values = [feat.id, feat.core_feature, feat.userstory?.length ?? 0];
    const bg = si % 2 === 0 ? COLORS.lightBlue : COLORS.white;
    excelStyles.applyRow(r, bg, COLORS.textDark, false, 30);
    r.getCell(1).font = excelStyles.font(true, COLORS.teal);
    r.getCell(1).alignment = excelStyles.align('center');
    r.getCell(3).alignment = excelStyles.align('center');
  }
}

function createExcelFeatureSheet(wb, feat) {
  const sheetName = `F${feat.id}`.slice(0, 31);
  const ws = wb.addWorksheet(sheetName, {
    views: [{ state: 'frozen', ySplit: 4 }],
  });

  ws.columns = [
    { key: 'a', width: 22 },
    { key: 'b', width: 55 },
    { key: 'c', width: 55 },
    { key: 'd', width: 55 },
  ];

  let r = 1;

  // Feature banner
  ws.mergeCells(`A${r}:D${r}`);
  const banner = ws.getCell(`A${r}`);
  banner.value = `FEATURE ${feat.id}`;
  banner.font = excelStyles.font(true, COLORS.white, 13);
  banner.fill = excelStyles.fill(COLORS.navy);
  banner.alignment = excelStyles.align('center');
  ws.getRow(r++).height = 32;

  ws.mergeCells(`A${r}:D${r}`);
  const featTitle = ws.getCell(`A${r}`);
  featTitle.value = feat.core_feature;
  featTitle.font = excelStyles.font(true, COLORS.white, 11);
  featTitle.fill = excelStyles.fill(COLORS.gold);
  featTitle.alignment = excelStyles.align('left');
  ws.getRow(r++).height = 40;

  r++;

  // Approach
  ws.mergeCells(`A${r}:D${r}`);
  const approachHdr = ws.getCell(`A${r}`);
  approachHdr.value = 'IMPLEMENTATION APPROACH';
  approachHdr.font = excelStyles.font(true, COLORS.white, 10);
  approachHdr.fill = excelStyles.fill(COLORS.blue);
  approachHdr.alignment = excelStyles.align('center');
  ws.getRow(r++).height = 22;

  const apColHdr = ws.getRow(r++);
  apColHdr.values = ['Step', 'Description', '', ''];
  ws.mergeCells(`B${r - 1}:D${r - 1}`);
  excelStyles.applyRow(apColHdr, COLORS.teal, COLORS.white, true, 20);

  for (let i = 0; i < (feat.approach ?? []).length; i++) {
    const row = ws.getRow(r++);
    row.getCell(1).value = `Step ${i + 1}`;
    row.getCell(2).value = feat.approach[i];
    ws.mergeCells(`B${r - 1}:D${r - 1}`);
    const bg = i % 2 === 0 ? COLORS.white : COLORS.lightBlue;
    excelStyles.applyRow(row, bg, COLORS.textDark, false, 40);
    row.getCell(1).font = excelStyles.font(true, COLORS.navy);
    row.getCell(1).alignment = excelStyles.align('center');
  }

  r++;

  // User Stories
  for (const story of (feat.userstory ?? [])) {
    ws.mergeCells(`A${r}:D${r}`);
    const storyBanner = ws.getCell(`A${r}`);
    storyBanner.value = `USER STORY  #${story.id}`;
    storyBanner.font = excelStyles.font(true, COLORS.white, 10);
    storyBanner.fill = excelStyles.fill(COLORS.green);
    storyBanner.alignment = excelStyles.align('center');
    ws.getRow(r++).height = 22;

    ws.mergeCells(`A${r}:D${r}`);
    const summaryCell = ws.getCell(`A${r}`);
    summaryCell.value = story.summary;
    summaryCell.font = excelStyles.font(false, COLORS.textDark, 10);
    summaryCell.fill = excelStyles.fill(COLORS.softGreen);
    summaryCell.alignment = excelStyles.align('left');
    summaryCell.border = excelStyles.border();
    ws.getRow(r++).height = 50;

    const subHdr = ws.getRow(r++);
    subHdr.values = ['Prerequisites', 'Actions', 'Test Data'];
    excelStyles.applyRow(subHdr, COLORS.blue, COLORS.white, true, 20);

    const maxLen = Math.max(
      (story.prerequesites ?? []).length,
      (story.actions ?? []).length,
      (story.test_data ?? []).length,
    );

    for (let i = 0; i < maxLen; i++) {
      const row = ws.getRow(r++);
      row.getCell(1).value = story.prerequesites?.[i] ?? '';
      row.getCell(2).value = story.actions?.[i] ?? '';
      row.getCell(3).value = story.test_data?.[i] ?? '';
      const bg = i % 2 === 0 ? COLORS.white : COLORS.lightBlue;
      excelStyles.applyRow(row, bg, COLORS.textDark, false, 30);
    }

    r++;
    ws.mergeCells(`A${r}:D${r}`);
    const acHdr = ws.getCell(`A${r}`);
    acHdr.value = 'ACCEPTANCE CRITERIA';
    acHdr.font = excelStyles.font(true, COLORS.white, 10);
    acHdr.fill = excelStyles.fill(COLORS.teal);
    acHdr.alignment = excelStyles.align('center');
    ws.getRow(r++).height = 20;

    const acColHdr = ws.getRow(r++);
    acColHdr.values = ['#', 'Criterion', '', ''];
    ws.mergeCells(`B${r - 1}:D${r - 1}`);
    excelStyles.applyRow(acColHdr, COLORS.blue, COLORS.white, true, 20);

    for (let i = 0; i < (story.acceptance_criteria ?? []).length; i++) {
      const row = ws.getRow(r++);
      row.getCell(1).value = i + 1;
      row.getCell(2).value = story.acceptance_criteria[i];
      ws.mergeCells(`B${r - 1}:D${r - 1}`);
      excelStyles.applyRow(row, COLORS.softGreen, COLORS.textDark, false, 30);
      row.getCell(1).alignment = excelStyles.align('center');
      row.getCell(1).font = excelStyles.font(true, COLORS.green);
    }

    r += 2;
  }
}

export async function generateExcel(data) {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Marketplace System';
  wb.created = new Date();

  createExcelOverviewSheet(wb, data);
  createExcelSummarySheet(wb, data);
  
  for (const feat of (data.feature_breackdown ?? [])) {
    createExcelFeatureSheet(wb, feat);
  }

  return wb;
}

// ─── Word Generation ──────────────────────────────────────────────────────

const wordStyles = {
  cellBorder: (color = 'BFBFBF') => ({
    style: BorderStyle.SINGLE,
    size: 1,
    color,
  }),
  
  allBorders: (color = 'BFBFBF') => ({
    top: wordStyles.cellBorder(color),
    bottom: wordStyles.cellBorder(color),
    left: wordStyles.cellBorder(color),
    right: wordStyles.cellBorder(color),
  }),
  
  bannerRow: (text, bgColor, textColor = COLORS.white, fontSize = 22, bold = true) =>
    new TableRow({
      children: [
        new TableCell({
          columnSpan: 4,
          borders: wordStyles.allBorders(bgColor),
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          verticalAlign: VerticalAlign.CENTER,
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text, bold, color: textColor, size: fontSize, font: 'Arial' })],
            }),
          ],
        }),
      ],
    }),
  
  dataRow: (cells, bgColor = COLORS.white, widths = [2340, 2340, 2340, 2340]) =>
    new TableRow({
      children: cells.map((text, i) =>
        new TableCell({
          width: { size: widths[i] ?? 2340, type: WidthType.DXA },
          borders: wordStyles.allBorders(),
          shading: { fill: bgColor, type: ShadingType.CLEAR },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [
            new Paragraph({
              children: [new TextRun({ text: String(text ?? ''), size: 18, font: 'Arial' })],
            }),
          ],
        })
      ),
    }),
  
  headerRow: (labels, widths) =>
    new TableRow({
      children: labels.map((label, i) =>
        new TableCell({
          width: { size: widths[i], type: WidthType.DXA },
          borders: wordStyles.allBorders(COLORS.blue),
          shading: { fill: COLORS.blue, type: ShadingType.CLEAR },
          margins: { top: 100, bottom: 100, left: 120, right: 120 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: label, bold: true, color: COLORS.white, size: 18, font: 'Arial' })],
            }),
          ],
        })
      ),
    }),
  
  spacer: () => new Paragraph({ children: [new TextRun('')], spacing: { after: 120 } })
};

function buildWordOverviewSection(data) {
  const children = [];

  // Title
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 240 },
      children: [new TextRun({ text: 'Saksoft BA Agent Overview', bold: true, size: 32, color: COLORS.navy, font: 'Arial' })],
    })
  );

  const overviewRows = [
    ['Project ID', String(data.id ?? '')],
    ['Executive Summary', data.executive_summary ?? ''],
  ];

  const objLines = (data.business_objectives ?? '').split('\n');
  let currentSection = 'Business Objectives';
  let buf = [];
  const objBlocks = [];
  for (const line of objLines) {
    const h = line.match(/^##\s+(.*)/);
    if (h) {
      if (buf.length) objBlocks.push([currentSection, buf.join('\n').trim()]);
      currentSection = h[1];
      buf = [];
    } else {
      const clean = line.replace(/^\s*[-*]\s*/, '').replace(/\*\*/g, '').trim();
      if (clean) buf.push(clean);
    }
  }
  if (buf.length) objBlocks.push([currentSection, buf.join('\n').trim()]);

  const allRows = [...overviewRows, ...objBlocks];
  const COL_W = [2500, 6860];

  const tableRows = [
    wordStyles.headerRow(['Field', 'Details'], COL_W),
    ...allRows.map(([field, value], idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_W[0], type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: idx % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: field, bold: true, color: COLORS.navy, size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            width: { size: COL_W[1], type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: idx % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: value.split('\n').map(line =>
              new Paragraph({ children: [new TextRun({ text: line, size: 18, font: 'Arial' })] })
            ),
          }),
        ],
      })
    ),
  ];

  children.push(
    new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL_W, rows: tableRows })
  );

  return children;
}

function buildWordSummarySection(features) {
  const children = [];

  children.push(wordStyles.spacer());
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 240 },
      children: [new TextRun({ text: 'FEATURES SUMMARY', bold: true, size: 28, color: COLORS.navy, font: 'Arial' })],
    })
  );

  const COL_W = [1440, 6480, 1440];
  const rows = [
    wordStyles.headerRow(['Feature ID', 'Core Feature', 'Stories'], COL_W),
    ...features.map((feat, idx) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: COL_W[0], type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: idx % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(feat.id), bold: true, color: COLORS.teal, size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            width: { size: COL_W[1], type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: idx % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: feat.core_feature, size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            width: { size: COL_W[2], type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: idx % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(feat.userstory?.length ?? 0), size: 18, font: 'Arial' })] })],
          }),
        ],
      })
    ),
  ];

  children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL_W, rows }));
  return children;
}

function buildWordFeatureSection(feat) {
  const children = [];

  children.push(wordStyles.spacer());

  // Feature banner
  const FULL = [9360];
  const COL4 = [2340, 2340, 2340, 2340];

  children.push(
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [9360],
      rows: [
        new TableRow({
          children: [new TableCell({
            columnSpan: 1,
            borders: wordStyles.allBorders(COLORS.navy),
            shading: { fill: COLORS.navy, type: ShadingType.CLEAR },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `FEATURE ${feat.id}`, bold: true, color: COLORS.white, size: 26, font: 'Arial' })] })],
          })],
        }),
        new TableRow({
          children: [new TableCell({
            columnSpan: 1,
            borders: wordStyles.allBorders(COLORS.gold),
            shading: { fill: COLORS.gold, type: ShadingType.CLEAR },
            margins: { top: 100, bottom: 100, left: 160, right: 160 },
            children: [new Paragraph({ children: [new TextRun({ text: feat.core_feature, bold: true, color: COLORS.white, size: 20, font: 'Arial' })] })],
          })],
        }),
      ],
    })
  );

  children.push(wordStyles.spacer());

  // Approach table
  children.push(
    new Paragraph({
      spacing: { before: 120, after: 80 },
      children: [new TextRun({ text: 'IMPLEMENTATION APPROACH', bold: true, color: COLORS.blue, size: 20, font: 'Arial' })],
    })
  );

  const approachRows = [
    wordStyles.headerRow(['Step', 'Description'], [1440, 7920]),
    ...(feat.approach ?? []).map((step, i) =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 1440, type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            verticalAlign: VerticalAlign.CENTER,
            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Step ${i + 1}`, bold: true, color: COLORS.navy, size: 18, font: 'Arial' })] })],
          }),
          new TableCell({
            width: { size: 7920, type: WidthType.DXA },
            borders: wordStyles.allBorders(),
            shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: step, size: 18, font: 'Arial' })] })],
          }),
        ],
      })
    ),
  ];

  children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: [1440, 7920], rows: approachRows }));

  // User Stories
  for (const story of (feat.userstory ?? [])) {
    children.push(wordStyles.spacer());

    // Story header
    children.push(
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [9360],
        rows: [
          new TableRow({
            children: [new TableCell({
              borders: wordStyles.allBorders(COLORS.green),
              shading: { fill: COLORS.green, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `USER STORY  #${story.id}`, bold: true, color: COLORS.white, size: 20, font: 'Arial' })] })],
            })],
          }),
          new TableRow({
            children: [new TableCell({
              borders: wordStyles.allBorders('A8D08D'),
              shading: { fill: COLORS.softGreen, type: ShadingType.CLEAR },
              margins: { top: 100, bottom: 100, left: 160, right: 160 },
              children: [new Paragraph({ children: [new TextRun({ text: story.summary, size: 18, font: 'Arial' })] })],
            })],
          }),
        ],
      })
    );

    // Prerequisites / Actions / Test Data
    const maxLen = Math.max(
      (story.prerequesites ?? []).length,
      (story.actions ?? []).length,
      (story.test_data ?? []).length,
    );
    const C3 = [3120, 3120, 3120];

    const storyRows = [
      wordStyles.headerRow(['Prerequisites', 'Actions', 'Test Data'], C3),
      ...Array.from({ length: maxLen }, (_, i) =>
        new TableRow({
          children: [
            story.prerequesites?.[i] ?? '',
            story.actions?.[i] ?? '',
            story.test_data?.[i] ?? '',
          ].map((text, ci) =>
            new TableCell({
              width: { size: C3[ci], type: WidthType.DXA },
              borders: wordStyles.allBorders(),
              shading: { fill: i % 2 === 0 ? COLORS.white : COLORS.lightBlue, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text, size: 18, font: 'Arial' })] })],
            })
          ),
        })
      ),
    ];

    children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: C3, rows: storyRows }));
    children.push(wordStyles.spacer());

    // Acceptance Criteria
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 80 },
        children: [new TextRun({ text: 'ACCEPTANCE CRITERIA', bold: true, color: COLORS.teal, size: 18, font: 'Arial' })],
      })
    );

    const AC_W = [720, 8640];
    const acRows = [
      wordStyles.headerRow(['#', 'Criterion'], AC_W),
      ...(story.acceptance_criteria ?? []).map((ac, i) =>
        new TableRow({
          children: [
            new TableCell({
              width: { size: AC_W[0], type: WidthType.DXA },
              borders: wordStyles.allBorders(),
              shading: { fill: COLORS.softGreen, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              verticalAlign: VerticalAlign.CENTER,
              children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(i + 1), bold: true, color: COLORS.green, size: 18, font: 'Arial' })] })],
            }),
            new TableCell({
              width: { size: AC_W[1], type: WidthType.DXA },
              borders: wordStyles.allBorders(),
              shading: { fill: COLORS.softGreen, type: ShadingType.CLEAR },
              margins: { top: 80, bottom: 80, left: 120, right: 120 },
              children: [new Paragraph({ children: [new TextRun({ text: ac, size: 18, font: 'Arial' })] })],
            }),
          ],
        })
      ),
    ];

    children.push(new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: AC_W, rows: acRows }));
  }

  return children;
}

export async function generateWord(data) {
  const features = data.feature_breackdown ?? [];

  const allChildren = [
    ...buildWordOverviewSection(data),
    ...buildWordSummarySection(features),
    ...features.flatMap((feat) => [
      new Paragraph({ children: [new PageBreak()] }),
      ...buildWordFeatureSection(feat),
    ]),
  ];

  const doc = new Document({
    styles: {
      default: {
        document: { run: { font: 'Arial', size: 20 } },
      },
    },
    numbering: {
      config: [
        {
          reference: 'bullets',
          levels: [{
            level: 0, format: LevelFormat.BULLET, text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          }],
        },
      ],
    },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
        },
      },
      children: allChildren,
    }],
  });

  return await Packer.toBuffer(doc);
}