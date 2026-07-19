export function downloadJsonPayload(payload, filename, browser = globalThis) {
  const blob = new browser.Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8'
  });
  const objectUrl = browser.URL.createObjectURL(blob);
  const link = browser.document.createElement('a');

  link.href = objectUrl;
  link.download = filename;
  browser.document.body.appendChild(link);
  link.click();

  browser.setTimeout(() => {
    link.remove();
    browser.URL.revokeObjectURL(objectUrl);
  }, 0);
}
