const XLSX = require('xlsx');
const path = require('path');

// Read GASTOS GENERALES
const wb1 = XLSX.readFile(path.join(__dirname, '..', 'mock', 'GASTOS GENERALES.xlsx'));
console.log('=== GASTOS GENERALES ===');
wb1.SheetNames.forEach(name => {
    const ws = wb1.Sheets[name];
    console.log('--- Sheet:', name, '---');
    console.log(XLSX.utils.sheet_to_csv(ws));
});

console.log('\n\n');

// Read LISTA PROVEEDORES Y PALET
const wb2 = XLSX.readFile(path.join(__dirname, '..', 'mock', 'LISTA PROVEEDORES Y PALET.xlsx'));
console.log('=== LISTA PROVEEDORES Y PALET ===');
wb2.SheetNames.forEach(name => {
    const ws = wb2.Sheets[name];
    console.log('--- Sheet:', name, '---');
    console.log(XLSX.utils.sheet_to_csv(ws));
});
