
const fs = require('fs');
const path = 'E:\\PLAN\\新建 文本文档.txt';
const outputPath = 'E:\\PLAN\\formatted_text.txt';

try {
  const data = fs.readFileSync(path, 'utf8');
  // Split by common sentence endings to create new lines, or just every N characters
  const formatted = data.replace(/([。！？；])/g, '$1\n'); 
  fs.writeFileSync(outputPath, formatted);
  console.log('File formatted successfully');
} catch (err) {
  console.error('Error:', err);
}
