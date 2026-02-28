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
    | { action: 'dial'; phone: string };

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

    // 3. Last resort — direct URL navigation (works on desktop browsers)
    if (payload.action === 'dial') {
        window.location.href = `tel:${payload.phone}`;
    } else if (payload.action === 'whatsapp') {
        const encoded = encodeURIComponent(payload.text);
        window.location.href = `https://wa.me/${payload.phone}?text=${encoded}`;
    }

    return false;
}
