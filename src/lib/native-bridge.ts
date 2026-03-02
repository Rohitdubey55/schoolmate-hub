/**
 * Native Bridge for MIT App Inventor WebView
 *
 * MIT App Inventor's WebView cannot handle non-HTTP URL schemes directly
 * (whatsapp://, tel:, etc.). This module sends structured messages to the
 * native App Inventor side via window.AppInventor.setWebViewString().
 *
 * The App Inventor project must have a WebViewer1.WebViewStringChanged event
 * that reads the JSON and uses ActivityStarter to handle it.
 *
 * See: /docs/app-inventor-setup.md for the required App Inventor blocks.
 */

export type BridgeAction =
    | { action: 'whatsapp'; phone: string; text: string }
    | { action: 'dial'; phone: string }
    | { action: 'share'; title: string; text?: string; file?: Blob }
    | { action: 'shareImage'; base64: string; mimeType: 'image/jpeg'; fileName: string; title: string };

/**
 * Send an action to the App Inventor native layer.
 * Returns true if the bridge was available, false if we fell back to URL navigation.
 */
export function sendNativeAction(payload: BridgeAction): boolean {
    // Pre-encode WhatsApp message text so App Inventor can use it directly
    // in the wa.me DataUri without needing UriEncode blocks on that side.
    const normalized: BridgeAction =
        payload.action === 'whatsapp'
            ? { ...payload, text: encodeURIComponent(payload.text) }
            : payload;
    const json = JSON.stringify(normalized);

    // 1. MIT App Inventor JS interface
    const appInventor = (window as any).AppInventor;
    if (appInventor && typeof appInventor.setWebViewString === 'function') {
        appInventor.setWebViewString(json);
        return true;
    }

    // 2. Custom Android JavaScriptInterface (fallback)
    const android = (window as any).Android;
    if (android) {
        if (payload.action === 'dial' && typeof android.makeCall === 'function') {
            android.makeCall(payload.phone);
            return true;
        }
        if (payload.action === 'whatsapp' && typeof android.openWhatsApp === 'function') {
            android.openWhatsApp(payload.phone, payload.text);
            return true;
        }
    }

    // 3. Web Share API (for sharing images/files)
    if (payload.action === 'share' && navigator.share) {
        const shareData: any = { title: payload.title };
        if (payload.text) shareData.text = payload.text;

        if (payload.file) {
            shareData.files = [new File([payload.file], 'receipt.png', { type: 'image/png' })];
        }

        navigator.share(shareData).then(() => true).catch(() => false);
        return true;
    }

    // 4. Web Share API for shareImage (modern browsers / Android Chrome)
    if (payload.action === 'shareImage' && navigator.canShare) {
        // Convert base64 → Blob → File and try navigator.share
        try {
            const binary = atob(payload.base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            const file = new File([bytes], payload.fileName, { type: payload.mimeType });
            if (navigator.canShare({ files: [file] })) {
                navigator.share({ title: payload.title, files: [file] }).catch(() => {/* user cancelled */ });
                return true;
            }
        } catch {
            // ignore — will fall through to return false
        }
    }

    // No bridge available — return false.
    // Do NOT navigate to tel: or wa.me URLs; in MIT App Inventor WebView,
    // wa.me redirects to whatsapp:// which causes ERR_URL_SCHEME.
    return false;
}
