import Docxtemplater from "docxtemplater";
import PizZip from "pizzip";
import { saveAs } from "file-saver";

export const generateQPMCReport = async (templateData: any) => {
  try {
    // 1. Fetch your pre-formatted blank Word Document template from the public folder
    // You need to place your "qpmc_template.docx" inside the /public folder of your React app.
    const response = await fetch("/qpmc_template.docx");
    if (!response.ok) {
      throw new Error(
        "Could not find the template file (/qpmc_template.docx). Make sure it is in your public folder.",
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const zip = new PizZip(arrayBuffer);

    // 2. Initialize Docxtemplater
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 3. Inject the data payload we created in MaintenanceView.tsx
    doc.render(templateData);

    // 4. Generate the final blob
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // 5. Trigger download
    const fileName = `LDCU-Forms-CIT-030-PreventiveMaintenanceChecklistForm_${templateData.workstation}__${templateData.date.replace(/\//g, "-")}.docx`;
    saveAs(out, fileName);
  } catch (error) {
    console.error("Error generating report:", error);
    alert(
      "Failed to generate the document. Please check the console for details.",
    );
  }
};
