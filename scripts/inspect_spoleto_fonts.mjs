async function inspectFonts() {
  try {
    const res = await fetch('https://www.spoleto.com.br/tabs/inicio');
    const html = await res.text();
    console.log('HTML length:', html.length);
    
    // Find font links and css links
    const fontMatches = html.match(/https?:\/\/[^"'>\s]+(?:fonts|css|woff2?|otf|ttf)[^"'>\s]*/gi) || [];
    console.log('Font/CSS links:', [...new Set(fontMatches)]);

    // Find style tags or font-family references
    const fontFamilies = html.match(/font-family:[^;}"'>]+/gi) || [];
    console.log('Font families in HTML:', [...new Set(fontFamilies)]);

    // Find all css stylesheet links
    const cssLinks = html.match(/href="([^"]+\.css[^"]*)"/gi) || [];
    console.log('CSS Links:', cssLinks);

    for (const link of cssLinks.slice(0, 5)) {
      const url = link.replace(/href="|"/g, '');
      const fullUrl = url.startsWith('http') ? url : `https://www.spoleto.com.br${url.startsWith('/') ? '' : '/'}${url}`;
      console.log('\nFetching CSS:', fullUrl);
      try {
        const cssRes = await fetch(fullUrl);
        const cssText = await cssRes.text();
        const cssFonts = cssText.match(/font-family:[^;}"'>]+/gi) || [];
        console.log('Fonts in CSS:', [...new Set(cssFonts)].slice(0, 10));
        const fontFaces = cssText.match(/@font-face\s*\{[^}]+\}/gi) || [];
        console.log('Font faces count:', fontFaces.length);
        if (fontFaces.length > 0) {
          console.log('Sample font face:', fontFaces.slice(0, 3));
        }
      } catch (e) {
        console.log('Error fetching css:', e.message);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

inspectFonts();
