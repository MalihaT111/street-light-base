# Local Mobile Testing

How to run the app locally and test it on a phone or tablet over WiFi — including camera and location features — before the app is deployed.

---

## Why this setup exists

Browser APIs like the **camera** (`getUserMedia`) and **geolocation** only work in a **secure context** (HTTPS). On your own machine, `localhost` counts as secure even without a certificate. But when you open the app on a phone using your laptop's local IP address (e.g. `192.168.1.206`), the browser treats it as plain HTTP — and blocks both APIs.

To get around this, the dev server is configured to:

1. **Serve over HTTPS** using a self-signed certificate (`@vitejs/plugin-basic-ssl`)
2. **Expose itself on the local network** so other devices on the same WiFi can reach it
3. **Proxy all `/api` requests** through itself to the Flask backend — so the phone never needs to talk to Flask directly, and CORS is handled automatically

---

## Starting the servers

Open two terminal tabs.

**Tab 1 — Backend:**
```bash
cd Backend
python app.py
```
Flask starts on `http://localhost:5000`.

**Tab 2 — Frontend:**
```bash
cd Frontend
npm run dev
```

Vite will print two URLs:
```
  ➜  Local:   https://localhost:5173/
  ➜  Network: https://192.168.1.XXX:5173/
```

---

## Regular localhost development

For day-to-day development on your laptop, open the **Local** URL: `https://localhost:5173`

Because the dev server now uses HTTPS (required for camera and location to work), the URL starts with `https://` instead of the usual `http://`. Your browser will show a security warning the first time — here is how to get past it:

**Chrome:** Click **Advanced → Proceed to localhost (unsafe)**  
Alternatively, with the warning page focused, type `thisisunsafe` (no box, just type it) — the page will load immediately.

**Safari:** Click **Show Details → visit this website → Visit Website**

**Firefox:** Click **Advanced → Accept the Risk and Continue**

You only need to do this once. After that, `https://localhost:5173` loads normally for the rest of the session.

---

## Opening on your phone (same WiFi)

The **Network** URL is what you open on your phone. The IP will match your laptop's current WiFi address and changes if you switch networks.

---

## Opening on your phone

1. Make sure your phone is on the **same WiFi network** as your laptop
2. Open the **Network URL** from the Vite output in your phone's browser (e.g. `https://192.168.1.206:5173`)
3. You will see a security warning because the certificate is self-signed — this is expected

**Safari (iOS):** Tap **Show Details → visit this website → Visit Website**

**Chrome (Android):** Tap **Advanced → Proceed to 192.168.1.XXX (unsafe)**

**Chrome (iOS):** Chrome on iOS may not show a "proceed" option. Use Safari instead — iOS requires all browsers to use WebKit, so Safari is equivalent for testing purposes.

After accepting once, the warning won't appear again for that session.

---

## How the proxy works

When the phone (or your laptop) makes an API call like `/api/login`, it goes to the Vite dev server, which forwards it to Flask running on your laptop:

```
Phone browser
  → https://192.168.1.206:5173/api/login   (Vite, HTTPS)
    → http://127.0.0.1:5000/api/login      (Flask, HTTP, local only)
```

Flask never needs to be exposed to the network. The phone only ever talks to Vite.

---

## How camera and location work

When a user taps a photo slot in the report form:

1. The browser opens the camera via `getUserMedia`  
   — on desktop this is your webcam  
   — on mobile this is the rear camera by default, with a flip button if a front camera is also available

2. When the shutter is pressed, the browser requests location permission via `navigator.geolocation`

3. Both the photo and coordinates are captured simultaneously and attached to the report

Because the page is served over HTTPS (via the self-signed cert), both APIs are available on mobile browsers.

---

## Troubleshooting

**"Unable to connect" / login not working**
- Check that Flask is running (`python app.py` in the Backend folder)
- Check that you're on the same WiFi as your laptop
- Make sure you accepted the SSL warning in the browser

**Camera not available on desktop**
- Your browser will ask for camera permission the first time — click Allow
- If you previously blocked it: go to browser settings → Site Settings → Camera → allow for `localhost`

**Location not working**
- The browser will ask for location permission when you press the shutter — tap Allow
- If denied, the photo is still saved but the report cannot be submitted without location

**Network URL not showing in Vite output**
- This can happen if your laptop is connected via Ethernet instead of WiFi, or if `host: true` was removed from `vite.config.js`

**IP address changed**
- Your laptop's local IP changes when you switch networks. Just use the new Network URL that Vite prints each time you run `npm run dev`
