import { stringify } from 'csv-stringify/sync';
import PDFDocument from 'pdfkit';
import { ExportFormat } from 'src/services/contracts/dto/export-format-type';
import * as XLSX from 'xlsx-js-style';

interface ExportedContract {
  'Property Name': string;
  'Client Name': string;
  Services: string;
  City: string;
  State: string;
  'Annual Value': string;
  'Cost/Unit/Year': string;
  'Vendor Name': string;
  'Contract Start Date': string;
  'Contract End Date': string;
  'Renewal Term': string | null;
  'Total Term': string;
  'Notice Requirements': string | null;
  'Renewal Terms': string | null;
  'Early Termination Fee': string | null;
  'Early Termination Requirements': string | null;
}

interface ExportedBackgroundJob {
  'Client Name': string;
  'Bulk Upload File': string;
  'File Name': string;
  'Uploaded By': string;
  'Created At': string;
  Status: string;
  'Failure Reason': string;
}

interface Column {
  header: string;
  width: number;
}

export const generateExcel = async (data: any[]): Promise<Buffer> => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data provided for Excel export');
    }

    const sanitizedData = data.map((row: any) => {
      return Object.fromEntries(
        Object.entries(row).map(([key, value]) => [
          key,
          typeof value === 'string' ? value.replace(/'/g, "'") : value,
        ]),
      );
    });

    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(sanitizedData, {
      header: Object.keys(sanitizedData[0]),
    });

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(worksheet['!ref']!);

    // Style header row
    for (let C = range.s.c; C <= range.e.c; C += 1) {
      const cellAddress = { c: C, r: 0 };
      const cellRef = XLSX.utils.encode_cell(cellAddress);

      // Get existing cell or create new one
      const cell = worksheet[cellRef] || { v: '', t: 's' };

      // Apply styles
      cell.s = {
        font: {
          bold: true,
          sz: 12,
          color: { rgb: '000000' },
        },
        fill: {
          fgColor: { rgb: 'EEEEEE' },
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
      };

      // Ensure the cell is in the worksheet
      worksheet[cellRef] = cell;
    }

    // Auto-size columns
    const colWidths = Object.keys(sanitizedData[0]).map((key) => ({
      wch: Math.max(
        key.length,
        ...sanitizedData.map((row) => String(row[key]).length),
      ),
    }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Contracts');

    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx',
      cellStyles: true,
    });
    return excelBuffer;
  } catch (error) {
    throw new Error(`Failed to generate Excel: ${error}`);
  }
};

export const generateCSV = (data: any[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data provided for CSV generation');
      }

      const sanitizedData = data.map((row: any) => {
        return Object.fromEntries(
          Object.entries(row).map(([key, value]) => [
            key,
            typeof value === 'string' ? value.replace(/' /g, "'") : value,
          ]),
        );
      });

      const output = stringify(sanitizedData, { header: true, quoted: true });
      resolve(Buffer.from(output));
    } catch (err) {
      reject(err);
    }
  });
};

const renderTableHeader = (
  doc: PDFDocument,
  columns: Column[],
  yPosition: number,
  columnSpacing: number,
) => {
  let xPosition: number = 50;
  doc.font('Helvetica-Bold').fontSize(10);
  columns.forEach((column) => {
    doc.text(column.header, xPosition, yPosition, {
      width: column.width,
      align: 'left',
    });
    xPosition += column.width + columnSpacing;
  });
};

const renderPDFHeader = (doc: PDFDocument) => {
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Connexus Contracts Reports', { align: 'center' })
    .moveDown();
};

const calculateCellHeight = (
  doc: PDFDocument,
  text: string,
  width: number,
  fontSize: number,
): number => {
  // Save current text state

  // Set measurement font and size
  doc.font('Helvetica').fontSize(fontSize);

  // Get text dimensions without rendering
  const lines = text.split('\n');
  let totalHeight = 0;

  lines.forEach((line) => {
    const wrappedText = doc.widthOfString(line, { width });
    const lineCount = Math.ceil(wrappedText / width);
    totalHeight += lineCount * (fontSize * 1.2); // 1.2 for line spacing
  });

  // Restore original font settings
  doc.font('Helvetica').fontSize(fontSize);

  return totalHeight;
};

const calculateRowHeight = (
  doc: PDFDocument,
  row: ExportedContract,
  columns: Column[],
  columnSpacing: number,
  fontSize: number,
): number => {
  const minRowHeight = 45;
  const padding = 10;
  let maxHeight = minRowHeight;

  const cellContents = [
    row['Property Name'],
    row['Client Name'],
    row.Services,
    row.City,
    row.State,
    row['Annual Value'],
    row['Cost/Unit/Year'],
    row['Vendor Name'],
    row['Contract Start Date'],
    row['Contract End Date'],
    row['Renewal Term'],
    row['Total Term'],
    row['Notice Requirements'],
    row['Renewal Terms'],
    row['Early Termination Fee'],
    row['Early Termination Requirements'],
  ];

  cellContents.forEach((content, index) => {
    const cellText = String(content || '');
    const cellWidth = columns[index].width - columnSpacing;
    const cellHeight = calculateCellHeight(doc, cellText, cellWidth, fontSize);
    maxHeight = Math.max(maxHeight, cellHeight + padding * 2);
  });

  return maxHeight;
};

const renderPDFRow = (
  doc: PDFDocument,
  row: ExportedContract,
  columns: Column[],
  pdfYCoordinate: number,
  columnSpacing: number,
  rowHeight: number,
) => {
  let pdfXCoordinate: number = 50;
  const cellContents = [
    row['Property Name'],
    row['Client Name'],
    row.Services,
    row.City,
    row.State,
    row['Annual Value'],
    row['Cost/Unit/Year'],
    row['Vendor Name'],
    row['Contract Start Date'],
    row['Contract End Date'],
    row['Renewal Term'],
    row['Total Term'],
    row['Notice Requirements'],
    row['Renewal Terms'],
    row['Early Termination Fee'],
    row['Early Termination Requirements'],
  ];

  cellContents.forEach((text, colIndex) => {
    doc.text(String(text), pdfXCoordinate, pdfYCoordinate + 5, {
      width: columns[colIndex].width - columnSpacing,
      align: 'left',
      lineBreak: true,
      height: rowHeight - 10, // Leave room for padding
    });
    pdfXCoordinate += columns[colIndex].width + columnSpacing;
  });
};

const drawRowSeparator = (
  doc: PDFDocument,
  pdfYCoordinate: number,
  rowHeight: number,
) => {
  doc
    .moveTo(50, pdfYCoordinate + rowHeight - 5)
    .lineTo(doc.page.width - 50, pdfYCoordinate + rowHeight - 5)
    .stroke();
};

const renderPDFTable = (doc: PDFDocument, data: ExportedContract[]) => {
  const tableTop: number = 100;
  const minRowHeight: number = 45;
  const columnSpacing: number = 10;
  const fontSize: number = 9;
  let pdfYCoordinate: number = tableTop;

  const pageWidth: number = doc.page.width - 80;
  const columns: Column[] = [
    { header: 'Property', width: pageWidth * 0.05 },
    { header: 'Client Name', width: pageWidth * 0.05 },
    { header: 'Services', width: pageWidth * 0.13 },
    { header: 'City', width: pageWidth * 0.025 },
    { header: 'State', width: pageWidth * 0.025 },
    { header: 'Annual Value', width: pageWidth * 0.04 },
    { header: 'Cost/Unit/Year', width: pageWidth * 0.04 },
    { header: 'Vendor Name', width: pageWidth * 0.05 },
    { header: 'Contract Start Date', width: pageWidth * 0.04 },
    { header: 'Contract End Date', width: pageWidth * 0.04 },
    { header: 'Renewal Term', width: pageWidth * 0.025 },
    { header: 'Total Term', width: pageWidth * 0.04 },
    { header: 'Notice Requirements', width: pageWidth * 0.11 },
    { header: 'Renewal Terms', width: pageWidth * 0.1 },
    { header: 'Early Termination Fee', width: pageWidth * 0.03 },
    { header: 'Early Termination Requirements', width: pageWidth * 0.13 },
  ];

  renderTableHeader(doc, columns, pdfYCoordinate, columnSpacing);
  pdfYCoordinate += minRowHeight;

  doc.font('Helvetica').fontSize(9);
  data.forEach((row: ExportedContract) => {
    const rowHeight = calculateRowHeight(
      doc,
      row,
      columns,
      columnSpacing,
      fontSize,
    );

    if (pdfYCoordinate + rowHeight > doc.page.height - 50) {
      doc.addPage();
      pdfYCoordinate = tableTop;
      renderTableHeader(doc, columns, pdfYCoordinate, columnSpacing);
      pdfYCoordinate += minRowHeight;
    }

    doc.font('Helvetica').fontSize(9);
    drawRowSeparator(doc, pdfYCoordinate, rowHeight);
    renderPDFRow(doc, row, columns, pdfYCoordinate, columnSpacing, rowHeight);
    pdfYCoordinate += rowHeight;
  });
};

export const generatePDF = (data: any[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data provided for PDF generation');
      }
      const chunks: any[] = [];
      const doc: PDFDocument = new PDFDocument({
        margin: 50,
        size: [595.28, 2000],
        layout: 'landscape',
      });

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      renderPDFHeader(doc);
      renderPDFTable(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

export const setExportResponseHeaders = (
  response: any,
  format: ExportFormat,
) => {
  const contentTypes = {
    [ExportFormat.CSV]: 'text/csv',
    [ExportFormat.XLSX]:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    [ExportFormat.PDF]: 'application/pdf',
  };

  const extension = (format || ExportFormat.XLSX).toLowerCase();

  response.set({
    'Content-Type': contentTypes[format],
    'Content-Disposition': `attachment; filename=existing-contracts-export.${extension}`,
  });
};

export const setBackgroundJobsExportResponseHeaders = (
  response: any,
  format: ExportFormat,
) => {
  const contentTypes = {
    [ExportFormat.CSV]: 'text/csv',
    [ExportFormat.XLSX]:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    [ExportFormat.PDF]: 'application/pdf',
  };

  const extension = (format || ExportFormat.XLSX).toLowerCase();

  response.set({
    'Content-Type': contentTypes[format],
    'Content-Disposition': `attachment; filename=background-jobs-export.${extension}`,
  });
};

// Background Jobs PDF Generation Functions

const renderBackgroundJobsTableHeader = (
  doc: PDFDocument,
  columns: Column[],
  yPosition: number,
  columnSpacing: number,
) => {
  let xPosition: number = 50;
  doc.font('Helvetica-Bold').fontSize(10);
  columns.forEach((column) => {
    doc.text(column.header, xPosition, yPosition, {
      width: column.width,
      align: 'left',
    });
    xPosition += column.width + columnSpacing;
  });
};

const renderBackgroundJobsPDFHeader = (doc: PDFDocument) => {
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Connexus Background Jobs Reports', { align: 'center' })
    .moveDown();
};

const calculateBackgroundJobsCellHeight = (
  doc: PDFDocument,
  text: string,
  width: number,
  fontSize: number,
): number => {
  doc.font('Helvetica').fontSize(fontSize);

  const lines = text.split('\n');
  let totalHeight = 0;

  lines.forEach((line) => {
    const wrappedText = doc.widthOfString(line, { width });
    const lineCount = Math.ceil(wrappedText / width);
    totalHeight += lineCount * (fontSize * 1.2);
  });

  doc.font('Helvetica').fontSize(fontSize);

  return totalHeight;
};

const calculateBackgroundJobsRowHeight = (
  doc: PDFDocument,
  row: ExportedBackgroundJob,
  columns: Column[],
  columnSpacing: number,
  fontSize: number,
): number => {
  const minRowHeight = 45;
  const padding = 10;
  let maxHeight = minRowHeight;

  const cellContents = [
    row['Client Name'],
    row['Bulk Upload File'],
    row['File Name'],
    row['Uploaded By'],
    row['Uploaded Date'],
    row.Status,
    row['Failure Reason'],
  ];

  cellContents.forEach((content, index) => {
    const cellText = String(content || '');
    const cellWidth = columns[index].width - columnSpacing;
    const cellHeight = calculateBackgroundJobsCellHeight(
      doc,
      cellText,
      cellWidth,
      fontSize,
    );
    maxHeight = Math.max(maxHeight, cellHeight + padding * 2);
  });

  return maxHeight;
};

const renderBackgroundJobsPDFRow = (
  doc: PDFDocument,
  row: ExportedBackgroundJob,
  columns: Column[],
  pdfYCoordinate: number,
  columnSpacing: number,
  rowHeight: number,
) => {
  let pdfXCoordinate: number = 50;
  const cellContents = [
    row['Client Name'],
    row['Bulk Upload File'],
    row['File Name'],
    row['Uploaded By'],
    row['Uploaded Date'],
    row.Status,
    row['Failure Reason'],
  ];

  cellContents.forEach((text, colIndex) => {
    doc.text(String(text), pdfXCoordinate, pdfYCoordinate + 5, {
      width: columns[colIndex].width - columnSpacing,
      align: 'left',
      lineBreak: true,
      height: rowHeight - 10,
    });
    pdfXCoordinate += columns[colIndex].width + columnSpacing;
  });
};

const drawBackgroundJobsRowSeparator = (
  doc: PDFDocument,
  pdfYCoordinate: number,
  rowHeight: number,
) => {
  doc
    .moveTo(50, pdfYCoordinate + rowHeight - 5)
    .lineTo(doc.page.width - 50, pdfYCoordinate + rowHeight - 5)
    .stroke();
};

const renderBackgroundJobsPDFTable = (
  doc: PDFDocument,
  data: ExportedBackgroundJob[],
) => {
  const tableTop: number = 100;
  const minRowHeight: number = 45;
  const columnSpacing: number = 10;
  const fontSize: number = 9;
  let pdfYCoordinate: number = tableTop;

  const pageWidth: number = doc.page.width - 80;
  const columns: Column[] = [
    { header: 'Client Name', width: pageWidth * 0.15 },
    { header: 'Bulk Upload File', width: pageWidth * 0.05 },
    { header: 'File Name', width: pageWidth * 0.2 },
    { header: 'Uploaded By', width: pageWidth * 0.15 },
    { header: 'Uploaded Date', width: pageWidth * 0.15 },
    { header: 'Status', width: pageWidth * 0.1 },
    { header: 'Failure Reason', width: pageWidth * 0.25 },
  ];

  renderBackgroundJobsTableHeader(doc, columns, pdfYCoordinate, columnSpacing);
  pdfYCoordinate += minRowHeight;

  doc.font('Helvetica').fontSize(9);
  data.forEach((row: ExportedBackgroundJob) => {
    const rowHeight = calculateBackgroundJobsRowHeight(
      doc,
      row,
      columns,
      columnSpacing,
      fontSize,
    );

    if (pdfYCoordinate + rowHeight > doc.page.height - 50) {
      doc.addPage();
      pdfYCoordinate = tableTop;
      renderBackgroundJobsTableHeader(
        doc,
        columns,
        pdfYCoordinate,
        columnSpacing,
      );
      pdfYCoordinate += minRowHeight;
    }

    doc.font('Helvetica').fontSize(9);
    drawBackgroundJobsRowSeparator(doc, pdfYCoordinate, rowHeight);
    renderBackgroundJobsPDFRow(
      doc,
      row,
      columns,
      pdfYCoordinate,
      columnSpacing,
      rowHeight,
    );
    pdfYCoordinate += rowHeight;
  });
};

export const generateBackgroundJobsPDF = (data: any[]): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      if (!data || data.length === 0) {
        throw new Error('No data provided for Background Jobs PDF generation');
      }
      const chunks: any[] = [];
      const doc: PDFDocument = new PDFDocument({
        margin: 50,
        size: [595.28, 2000],
        layout: 'landscape',
      });

      doc.on('data', chunks.push.bind(chunks));
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      renderBackgroundJobsPDFHeader(doc);
      renderBackgroundJobsPDFTable(doc, data);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
