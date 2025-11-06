import { S3Service } from '@app/shared/s3';
import { Injectable } from '@nestjs/common';
import { ExportFileTypes } from '@prisma/client';
import { stringify } from 'csv-stringify';
import PdfPrinter from 'pdfmake/src/printer';
import * as XLSX from 'xlsx-js-style';

export interface ExportData {
  headers: string[];
  rows: (string | number | Date | null)[][];
  title?: string;
}

@Injectable()
export class FileGeneratorService {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * Generate Excel file from data
   */
  async generateExcel(data: ExportData): Promise<Buffer> {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Prepare data for XLSX
    const worksheetData = [];

    // Add headers
    worksheetData.push(data.headers);

    // Add data rows
    data.rows.forEach((row) => {
      worksheetData.push(row);
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);

    // Style headers
    const headerRowIndex = 0;
    data.headers.forEach((_, colIndex) => {
      const cellAddress = XLSX.utils.encode_cell({
        r: headerRowIndex,
        c: colIndex,
      });
      if (!ws[cellAddress]) ws[cellAddress] = {};
      ws[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
      };
    });

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Export Data');

    // Generate buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return Buffer.from(buffer);
  }

  /**
   * Generate CSV file from data
   */
  generateCSV(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const csvData = [data.headers, ...data.rows];

      stringify(
        csvData,
        {
          header: false,
          quoted: true,
        },
        (err, output) => {
          if (err) {
            reject(err);
          } else {
            resolve(Buffer.from(output, 'utf-8'));
          }
        },
      );
    });
  }

  /**
   * Generate PDF file from data using PDFMake
   */
  generatePDF(data: ExportData): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        // Define fonts
        const fonts = {
          Helvetica: {
            normal: 'Helvetica',
            bold: 'Helvetica-Bold',
            italics: 'Helvetica-Oblique',
            bolditalics: 'Helvetica-BoldOblique',
          },
        };

        // Create printer
        const printer = new PdfPrinter(fonts);

        // Use full width with equal distribution
        const columnCount = data.headers.length;
        const columnWidths = data.headers.map(
          () => `${Math.floor(100 / columnCount)}%`,
        );

        // Prepare table body
        const tableBody = [
          // Header row
          data.headers.map((header) => ({
            text: header,
            style: 'tableHeader',
            alignment: 'center',
          })),
          // Data rows - filter out empty rows and ensure all cells have content
          ...data.rows
            .filter((row) => {
              // Check if row has any meaningful content
              return row.some((cell) => {
                if (cell === null || cell === undefined) return false;
                const cellStr = String(cell).trim();
                return cellStr.length > 0;
              });
            })
            .map((row) =>
              row.map((cell) => ({
                text: String(cell || 'N/A'),
                style: 'tableCell',
                margin: [2, 2, 2, 2], // Add small margins for better spacing
                wordWrap: 'break-word', // Allow wrapping but don't break words
              })),
            ),
        ];

        // Document definition
        const docDefinition = {
          pageSize: 'A4',
          pageOrientation: 'landscape' as const,
          pageMargins: [40, 60, 40, 60], // Balanced margins for better centering
          content: [
            // Title
            ...(data.title
              ? [
                  {
                    text: data.title,
                    style: 'title',
                    alignment: 'center' as const,
                    margin: [0, 0, 0, 20],
                  },
                ]
              : []),
            // Table
            {
              table: {
                headerRows: 1,
                widths: columnWidths,
                body: tableBody,
                keepTogether: true, // Prevent table from breaking across pages
                dontBreakRows: true, // Prevent rows from breaking across pages
              },
              alignment: 'center',
              margin: [0, 10, 0, 10], // Remove horizontal margins for full width
              layout: {
                fillColor: (rowIndex: number) => {
                  // eslint-disable-next-line no-nested-ternary
                  return rowIndex === 0
                    ? '#f0f0f0'
                    : rowIndex % 2 === 0
                      ? '#ffffff'
                      : '#f9f9f9';
                },
                hLineWidth: () => 1,
                vLineWidth: () => 1,
                hLineColor: () => '#333333',
                vLineColor: () => '#333333',
                paddingLeft: () => 8,
                paddingRight: () => 8,
                paddingTop: () => 6,
                paddingBottom: () => 6,
              },
            },
          ],
          styles: {
            title: {
              fontSize: 20,
              bold: true,
              font: 'Helvetica',
            },
            tableHeader: {
              fontSize: 12,
              bold: true,
              font: 'Helvetica',
              color: '#000000',
            },
            tableCell: {
              fontSize: 10, // Slightly smaller font
              font: 'Helvetica',
              color: '#000000',
              lineHeight: 1.2, // Better line spacing
            },
          },
          defaultStyle: {
            font: 'Helvetica',
          },
        };

        // Generate PDF
        const pdfDoc = printer.createPdfKitDocument(docDefinition);
        const chunks: Buffer[] = [];

        pdfDoc.on('data', (chunk) => {
          chunks.push(chunk);
        });

        pdfDoc.on('end', () => {
          resolve(Buffer.concat(chunks));
        });

        pdfDoc.on('error', reject);

        pdfDoc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generate file based on type
   */
  async generateFile(
    fileType: ExportFileTypes,
    data: ExportData,
    id?: string,
    fileName?: string,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    extension: string;
    s3Key?: string;
  }> {
    let buffer: Buffer;
    let mimeType: string;
    let extension: string;

    switch (fileType) {
      case ExportFileTypes.XLSX:
        buffer = await this.generateExcel(data);
        mimeType =
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        extension = 'xlsx';
        break;
      case ExportFileTypes.CSV:
        buffer = await this.generateCSV(data);
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case ExportFileTypes.PDF:
        buffer = await this.generatePDF(data);
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Upload to S3 if id is provided
    let s3Key: string | undefined;

    if (id) {
      s3Key = `temp/export/${id}/${`${fileName}.${extension}`}`;
      await this.s3Service.uploadFile({
        key: s3Key,
        body: buffer,
        contentType: mimeType,
      });
    }

    return { buffer, mimeType, extension, s3Key };
  }
}
