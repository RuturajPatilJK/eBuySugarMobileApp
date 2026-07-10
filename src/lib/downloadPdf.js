/**
 * Cross-platform PDF download:
 *  - Web browser  → pdf.save() (normal anchor-download)
 *  - Android APK  → Capacitor Filesystem → open with system viewer
 */
export async function downloadPdf(pdf, fileName) {
    const isNative =
        typeof window !== 'undefined' &&
        window.Capacitor &&
        window.Capacitor.isNativePlatform();

    if (!isNative) {
        pdf.save(fileName);
        return;
    }

    try {
        const { Filesystem, Directory } = await import('@capacitor/filesystem');
        const { Capacitor } = await import('@capacitor/core');

        // Convert PDF to base64 string
        const arrayBuffer = pdf.output('arraybuffer');
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        const base64 = btoa(binary);

        // Write to app cache directory (no permissions needed on Android 10+)
        const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Cache,
            recursive: true,
        });

        // Convert native URI to a URL the WebView can open
        const viewUrl = Capacitor.convertFileSrc(result.uri);
        window.open(viewUrl, '_system');

    } catch (err) {
        console.error('[PDF] Capacitor save failed, trying fallback:', err);
        // Fallback: open data URI inline in WebView
        try {
            const dataUri = pdf.output('datauristring');
            const win = window.open('', '_blank');
            if (win) {
                win.document.write(
                    `<html><body style="margin:0">` +
                    `<embed src="${dataUri}" type="application/pdf" width="100%" height="100%"/>` +
                    `</body></html>`
                );
            }
        } catch (e) {
            console.error('[PDF] Fallback also failed:', e);
        }
    }
}
