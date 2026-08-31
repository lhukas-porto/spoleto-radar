async function printAllFontFaces() {
  const cssRes = await fetch('https://www.spoleto.com.br/styles.c01db7b725a009ad.css');
  const cssText = await cssRes.text();
  const fontFaces = cssText.match(/@font-face\s*\{[^}]+\}/gi) || [];
  console.log('All Font Faces:');
  fontFaces.forEach(f => console.log(f));
}

printAllFontFaces();
