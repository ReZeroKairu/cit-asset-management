// frontend/src/utils/generateWordReport.ts
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  WidthType,
  TextRun,
  HeadingLevel,
  AlignmentType,
  BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

// Define the interface based on your existing data structure
interface WorkstationAsset {
  asset_id: number;
  property_tag_no: string | null;
  serial_number: string | null;
  description: string | null;
  quantity: number | null;
  unit_name: string | null;
}

interface Workstation {
  workstation_id: number;
  workstation_name: string;
  lab_name: string | null;
  location: string | null;
  assets: WorkstationAsset[];
}

export const generateWorkstationReport = (workstations: Workstation[]) => {
  // 1. Create the Document
  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // --- REPORT TITLE ---
          new Paragraph({
            text: "Workstation Inventory Report",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            text: `Generated on: ${new Date().toLocaleDateString()}`,
            alignment: AlignmentType.CENTER,
            spacing: { after: 500 },
          }),

          // --- LOOP THROUGH WORKSTATIONS ---
          ...workstations.flatMap((ws) => [
            // Workstation Header
            new Paragraph({
              children: [
                new TextRun({
                  text: `Workstation: ${ws.workstation_name}`,
                  bold: true,
                  size: 28, // 14pt
                }),
                new TextRun({
                  text: `  (Location: ${ws.lab_name || "N/A"} - ${ws.location || "N/A"})`,
                  italics: true,
                  size: 24, // 12pt
                }),
              ],
              spacing: { before: 400, after: 200 },
              heading: HeadingLevel.HEADING_2,
            }),

            // Asset Table
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: [
                // Table Header
                new TableRow({
                  children: [
                    "Property Tag",
                    "Serial No.",
                    "Unit Type",
                    "Description",
                    "Qty",
                  ].map(
                    (text) =>
                      new TableCell({
                        children: [
                          new Paragraph({
                            children: [new TextRun({ text, bold: true })],
                          }),
                        ],
                        shading: { fill: "E0E0E0" }, // Light gray background
                        borders: {
                          bottom: { style: BorderStyle.SINGLE, size: 2 },
                        },
                      }),
                  ),
                }),
                // Table Rows (Assets)
                ...ws.assets.map(
                  (asset) =>
                    new TableRow({
                      children: [
                        new TableCell({
                          children: [
                            new Paragraph(asset.property_tag_no || "-"),
                          ],
                        }),
                        new TableCell({
                          children: [new Paragraph(asset.serial_number || "-")],
                        }),
                        new TableCell({
                          children: [new Paragraph(asset.unit_name || "-")],
                        }),
                        new TableCell({
                          children: [new Paragraph(asset.description || "-")],
                        }),
                        new TableCell({
                          children: [
                            new Paragraph(String(asset.quantity || 1)),
                          ],
                        }),
                      ],
                    }),
                ),
              ],
            }),
            // Spacer between workstations
            new Paragraph({ text: "", spacing: { after: 300 } }),
          ]),

          // --- SUMMARY SECTION ---
          new Paragraph({
            text: "Summary",
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 500, after: 200 },
          }),
          new Paragraph({
            text: `Total Workstations: ${workstations.length}`,
            bullet: { level: 0 },
          }),
          new Paragraph({
            text: `Total Assets: ${workstations.reduce((sum, ws) => sum + ws.assets.length, 0)}`,
            bullet: { level: 0 },
          }),
        ],
      },
    ],
  });

  // 2. Pack and Download
  Packer.toBlob(doc).then((blob) => {
    saveAs(
      blob,
      `Workstation_Report_${new Date().toISOString().split("T")[0]}.docx`,
    );
  });
};
