import fs from 'fs';
import path from 'path';

try {
  const distDir = path.resolve('dist');
  const indexPath = path.join(distDir, 'index.html');

  if (!fs.existsSync(indexPath)) {
    console.error('dist/index.html does not exist.');
    process.exit(1);
  }

  let html = fs.readFileSync(indexPath, 'utf8');

  // Match CSS
  const cssMatch = html.match(/<link\s+rel="stylesheet"[^>]*href="\/assets\/([^"]+)"[^>]*>/i);
  if (cssMatch) {
    const cssFileName = cssMatch[1];
    const cssPath = path.join(distDir, 'assets', cssFileName);
    if (fs.existsSync(cssPath)) {
      const cssContent = fs.readFileSync(cssPath, 'utf8');
      html = html.replace(cssMatch[0], `<style>\n${cssContent}\n</style>`);
      console.log(`Inlined CSS: ${cssFileName} (${(cssContent.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Match JS
  const jsMatch = html.match(/<script\s+type="module"[^>]*src="\/assets\/([^"]+)"[^>]*><\/script>/i);
  if (jsMatch) {
    const jsFileName = jsMatch[1];
    const jsPath = path.join(distDir, 'assets', jsFileName);
    if (fs.existsSync(jsPath)) {
      const jsContent = fs.readFileSync(jsPath, 'utf8');
      // Escape any closing script tag inside string literals if present
      const safeJs = jsContent.replace(/<\/script>/gi, '<\\/script>');
      html = html.replace(jsMatch[0], `<script type="module">\n${safeJs}\n</script>`);
      console.log(`Inlined JS: ${jsFileName} (${(jsContent.length / 1024).toFixed(1)} KB)`);
    }
  }

  // Write standalone single-file versions (preserves original clean dist/index.html for Vercel / web hosts)
  fs.writeFileSync(path.join(distDir, 'standalone.html'), html, 'utf8');
  try {
    fs.writeFileSync(path.resolve('standalone-index.html'), html, 'utf8');
  } catch (_) {}
  console.log('Successfully generated standalone.html');
} catch (err) {
  console.warn('Notice: inline bundle skipped:', err.message);
}
