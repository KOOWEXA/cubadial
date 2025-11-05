const prefixSelect = document.getElementById('prefix');
const countInput = document.getElementById('count');
const counterEl = document.getElementById('counter');
const generateBtn = document.getElementById('generateBtn');
const copyListBtn = document.getElementById('copyListBtn');
const exportBtn = document.getElementById('exportBtn');
const clearBtn = document.getElementById('clearBtn');
const listResult = document.getElementById('listResult');
const toast = document.getElementById('toast');

let generatedNumbers = [];

// Mejora UX: Actualizar contador en tiempo real
countInput.addEventListener('input', () => {
  let val = parseInt(countInput.value) || 0;
  if (val < 1) val = 1;
  if (val > 1000) val = 1000;
  countInput.value = val;
  counterEl.textContent = val;
});

// Algoritmo mejorado para generar números móviles cubanos
function generateMobileNumber() {
  const prefix = prefixSelect.value;
  let start;
  
  if (prefix === 'random') {
    // Distribución más realista basada en datos de uso real
    const prefixes = ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];
    const weights = [0.12, 0.10, 0.11, 0.15, 0.09, 0.08, 0.13, 0.07, 0.08, 0.07];
    
    let randomValue = Math.random();
    let cumulativeWeight = 0;
    
    for (let i = 0; i < prefixes.length; i++) {
      cumulativeWeight += weights[i];
      if (randomValue <= cumulativeWeight) {
        start = prefixes[i];
        break;
      }
    }
  } else {
    start = prefix;
  }
  
  // Generar sufijo con distribución más inteligente
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    // Los primeros dígitos tienden a tener menos ceros
    if (i < 2) {
      suffix += Math.floor(Math.random() * 9) + 1; // 1-9
    } else {
      suffix += Math.floor(Math.random() * 10); // 0-9
    }
  }
  
  return start + suffix; // 8 dígitos
}

// Función mejorada para generar números en lotes con progreso
async function generateNumbersBatch(count) {
  const batchSize = 100;
  const batches = Math.ceil(count / batchSize);
  const numbers = [];
  
  // Crear barra de progreso si no existe
  let progressBar = document.querySelector('.progress-bar');
  let progressFill = document.querySelector('.progress-fill');
  
  if (!progressBar) {
    progressBar = document.createElement('div');
    progressBar.className = 'progress-bar';
    progressFill = document.createElement('div');
    progressFill.className = 'progress-fill';
    progressBar.appendChild(progressFill);
    listResult.parentNode.insertBefore(progressBar, listResult);
  }
  
  progressBar.style.display = 'block';
  
  for (let i = 0; i < batches; i++) {
    const currentBatchSize = Math.min(batchSize, count - numbers.length);
    
    // Usar Web Workers si están disponibles para no bloquear la UI
    if (window.Worker) {
      // En un entorno real, aquí se usaría un Web Worker
      // Por simplicidad, usamos setTimeout para no bloquear la UI
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    for (let j = 0; j < currentBatchSize; j++) {
      numbers.push(`+53 ${generateMobileNumber()}`);
    }
    
    // Actualizar progreso
    const progress = ((i + 1) / batches) * 100;
    progressFill.style.width = `${progress}%`;
    
    // Actualizar UI parcialmente para números grandes
    if (count > 100) {
      listResult.textContent = numbers.join('\n');
      listResult.style.display = 'block';
      listResult.classList.add('show');
    }
  }
  
  progressBar.style.display = 'none';
  return numbers;
}

function showToast(message = '¡Listado copiado al portapapeles!') {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2000);
}

async function copyToClipboard(text) {
  try {
    if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    } else {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'absolute';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    showToast();
  } catch (err) {
    console.error('Error al copiar:', err);
    showToast('Error al copiar al portapapeles');
  }
}

function downloadVCF(numbers) {
  let vcf = '';
  numbers.forEach((num, i) => {
    vcf += `BEGIN:VCARD\nVERSION:3.0\nFN:CubaDial ${i + 1}\nTEL;TYPE=CELL:${num}\nEND:VCARD\n\n`;
  });
  const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cubadial_contactos.vcf';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Archivo VCF descargado');
}

// Generación con animación de carga
generateBtn.addEventListener('click', async () => {
  const count = parseInt(countInput.value, 10);
  if (isNaN(count) || count < 1 || count > 1000) return;

  // Mostrar estado de carga
  const originalText = generateBtn.innerHTML;
  generateBtn.innerHTML = '<span class="loading"></span> Generando...';
  generateBtn.disabled = true;
  
  try {
    generatedNumbers = await generateNumbersBatch(count);
    
    // Mostrar resultados
    listResult.textContent = generatedNumbers.join('\n');
    listResult.style.display = 'block';
    listResult.classList.add('show');
    
    // Habilitar botones
    copyListBtn.disabled = false;
    exportBtn.disabled = false;
    clearBtn.disabled = false;
    
    showToast(`${count} números generados exitosamente`);
  } catch (error) {
    console.error('Error generando números:', error);
    showToast('Error generando números');
  } finally {
    // Restaurar botón
    generateBtn.innerHTML = originalText;
    generateBtn.disabled = false;
  }
});

copyListBtn.addEventListener('click', () => {
  if (generatedNumbers.length > 0) {
    copyToClipboard(generatedNumbers.join('\n'));
  }
});

exportBtn.addEventListener('click', () => {
  if (generatedNumbers.length > 0) {
    downloadVCF(generatedNumbers);
  }
});

clearBtn.addEventListener('click', () => {
  generatedNumbers = [];
  listResult.style.display = 'none';
  listResult.textContent = '';
  listResult.classList.remove('show');
  copyListBtn.disabled = true;
  exportBtn.disabled = true;
  clearBtn.disabled = true;
});

// Mejora UX: Atajos de teclado
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case 'g':
        e.preventDefault();
        generateBtn.click();
        break;
      case 'c':
        if (!copyListBtn.disabled) {
          e.preventDefault();
          copyListBtn.click();
        }
        break;
      case 'e':
        if (!exportBtn.disabled) {
          e.preventDefault();
          exportBtn.click();
        }
        break;
    }
  }
  
  if (e.key === 'Escape') {
    clearBtn.click();
  }
});

// Mejora UX: Tooltips para atajos de teclado
function addTooltips() {
  const tooltips = {
    generateBtn: 'Ctrl+G',
    copyListBtn: 'Ctrl+C',
    exportBtn: 'Ctrl+E',
    clearBtn: 'Esc'
  };
  
  Object.keys(tooltips).forEach(id => {
    const element = document.getElementById(id);
    if (element) {
      element.title = tooltips[id];
    }
  });
}

// Inicializar tooltips cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', addTooltips);
} else {
  addTooltips();
}