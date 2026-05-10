import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

/**
 * Generates a certificate on a canvas element based on the template and participant data.
 * @param {HTMLCanvasElement} canvas - The canvas to draw on
 * @param {Object} template - The certificate template object with template_url and placeholder_map
 * @param {Object} participantData - The participant's form data
 * @returns {Promise<void>}
 */
const imageCache = new Map();

export const drawCertificateOnCanvas = (canvas, template, participantData) => {
  return new Promise((resolve, reject) => {
    if (!template || !template.template_url) {
      reject(new Error('No template URL provided'));
      return;
    }

    const ctx = canvas.getContext('2d');
    
    const render = (img) => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      if (template.placeholder_map) {
        Object.keys(template.placeholder_map).forEach(field => {
          const mapping = template.placeholder_map[field];
          
          // Try exact match first, then fuzzy match
          let value = participantData[field];
          if ((value === undefined || value === null) && field.trim().length > 0) {
            const fuzzyKey = Object.keys(participantData).find(k => 
              k.toLowerCase().trim() === field.toLowerCase().trim() ||
              k.toLowerCase().includes(field.toLowerCase()) ||
              field.toLowerCase().includes(k.toLowerCase())
            );
            if (fuzzyKey) value = participantData[fuzzyKey];
          }
          
          if (value !== undefined && value !== null && mapping) {
            const x = (canvas.width * mapping.x) / 100;
            const y = (canvas.height * mapping.y) / 100;
            const fontSize = mapping.size || 48;
            const color = mapping.color || '#000000';
            const font = mapping.fontFamily || '"Syne", sans-serif';
            const weight = mapping.fontWeight || '600';
            const align = mapping.textAlign || 'center';
            
            ctx.font = `${weight} ${fontSize}px ${font}`;
            ctx.fillStyle = color;
            ctx.textAlign = align;
            ctx.textBaseline = 'middle';
            
            ctx.fillText(String(value), x, y);
          }
        });
      }
      resolve();
    };

    if (imageCache.has(template.template_url)) {
      render(imageCache.get(template.template_url));
    } else {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        imageCache.set(template.template_url, img);
        render(img);
      };
      img.onerror = () => reject(new Error('Failed to load template image'));
      img.src = template.template_url;
    }
  });
};

export const downloadAsPDF = (canvas, filename) => {
  try {
    const imgData = canvas.toDataURL('image/png');
    // Default to landscape A4
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    pdf.save(filename);
  } catch (error) {
    console.error(error);
    toast.error('Failed to generate PDF');
  }
};

export const downloadAsPNG = (canvas, filename) => {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error(error);
    toast.error('Failed to generate PNG');
  }
};

/**
 * Generates a PDF and returns it as a base64 string (no prefix)
 */
export const getCertificateBase64 = async (template, participantData) => {
  const canvas = document.createElement('canvas');
  await drawCertificateOnCanvas(canvas, template, participantData);
  
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });
  
  // Use JPEG instead of PNG for much faster encoding on large canvases
  const imgData = canvas.toDataURL('image/jpeg', 0.9);
  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);
  
  const dataUri = pdf.output('datauristring');
  return dataUri.split(',')[1];
};
