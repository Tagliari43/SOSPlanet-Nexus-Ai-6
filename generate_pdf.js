import fs from 'fs';
import { jsPDF } from 'jspdf';

const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const imgBuffer = fs.readFileSync('./public/historico_escolar_unificado.jpg');
const base64Image = `data:image/jpeg;base64,${imgBuffer.toString('base64')}`;

// A4 dimensions: 210 x 297 mm
doc.addImage(base64Image, 'JPEG', 0, 0, 210, 297);
doc.save('./public/historico_escolar_eder_rodrigo_tagliari.pdf');

console.log('PDF gerado com sucesso a partir da foto original unificada!');
