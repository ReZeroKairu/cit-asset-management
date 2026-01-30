import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { saveAs } from "file-saver";

// Helper to load the binary file
const loadFile = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load template: ${response.statusText}`);
  }
  return await response.arrayBuffer();
};

export const generateTemplateReport = async (
  templatePath: string,
  data: any,
  fileName: string,
) => {
  try {
    // 1. Load the template file
    const content = await loadFile(templatePath);

    // 2. Unzip the content (docx is essentially a zip file)
    const zip = new PizZip(content);

    // 3. Create the template instance
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
    });

    // 4. Render the document (Fill in the tags)
    doc.render(data);

    // 5. Generate the output blob
    const out = doc.getZip().generate({
      type: "blob",
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    // 6. Save the file
    saveAs(out, fileName);
  } catch (error) {
    console.error("Error generating document:", error);
    alert(
      "Could not generate report. Please ensure the template file exists in src/assets/.",
    );
  }
};
