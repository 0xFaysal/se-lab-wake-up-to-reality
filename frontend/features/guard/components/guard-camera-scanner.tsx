"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, CameraOff, Flashlight, Loader2, RefreshCw, SwitchCamera } from "lucide-react";
import { Button } from "@/components/ui/button";

type ScannerState = "idle" | "requesting" | "scanning" | "denied" | "unavailable" | "error" | "scanned";
type CameraDevice = { id: string; label: string };
type ScannerInstance = import("html5-qrcode").Html5Qrcode;

export function GuardCameraScanner({ onScan, disabled = false }: { onScan: (credential: string) => void; disabled?: boolean }) {
  const elementId = `guard-qr-reader-${useId().replaceAll(":", "")}`;
  const scannerRef = useRef<ScannerInstance | null>(null);
  const decodedRef = useRef(false);
  const mountedRef = useRef(true);
  const [state, setState] = useState<ScannerState>("idle");
  const [message, setMessage] = useState("Camera access starts only when you choose Start camera.");
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [cameraIndex, setCameraIndex] = useState(0);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const stop = useCallback(async () => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // The media stream may already be closed by the browser or route change.
    }
  }, []);

  const classifyError = useCallback((error: unknown) => {
    const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
    if (/notallowed|permission|denied/i.test(text)) {
      setState("denied");
      setMessage("Camera permission is blocked. Allow camera access in your browser settings, then retry—or enter the access credential manually.");
    } else if (/notfound|devicesnotfound|no camera|overconstrained/i.test(text)) {
      setState("unavailable");
      setMessage("No usable camera was found on this device. Use manual credential entry instead.");
    } else {
      setState("error");
      setMessage("The camera could not start. Close any other app using it, then retry.");
    }
  }, []);

  const start = useCallback(async (cameraId?: string) => {
    if (disabled || state === "requesting") return;
    if (typeof window === "undefined" || !window.isSecureContext) {
      setState("unavailable");
      setMessage("Camera scanning requires HTTPS or localhost. Open this portal over a secure connection, or enter the credential manually.");
      return;
    }

    setState("requesting");
    setMessage("Requesting camera access…");
    decodedRef.current = false;
    setTorchOn(false);
    await stop();

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import("html5-qrcode");
      if (!mountedRef.current) return;
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        useBarCodeDetectorIfSupported: true,
        verbose: false,
      });
      scannerRef.current = scanner;
      await scanner.start(
        cameraId ?? { facingMode: "environment" },
        {
          fps: 10,
          qrbox: (width, height) => {
            const edge = Math.floor(Math.min(width, height) * 0.72);
            return { width: edge, height: edge };
          },
          aspectRatio: 1,
          disableFlip: false,
        },
        (decodedText) => {
          if (decodedRef.current) return;
          decodedRef.current = true;
          setState("scanned");
          setMessage("QR detected. Verifying with ParkEase…");
          try { scanner.pause(true); } catch { /* Scanner may have stopped between frames. */ }
          onScan(decodedText.trim());
          void stop();
        },
        () => undefined,
      );
      if (!mountedRef.current) {
        await stop();
        return;
      }
      setState("scanning");
      setMessage("Ready to scan. Hold the driver’s QR code inside the frame.");
      try {
        const available = await Html5Qrcode.getCameras();
        if (mountedRef.current) {
          setCameras(available);
          const activeId = scanner.getRunningTrackSettings().deviceId;
          const activeIndex = available.findIndex((camera) => camera.id === activeId);
          if (activeIndex >= 0) setCameraIndex(activeIndex);
        }
      } catch {
        // Scanning can continue even when device enumeration is unavailable.
      }
      try {
        const capabilities = scanner.getRunningTrackCapabilities() as MediaTrackCapabilities & { torch?: boolean };
        setTorchAvailable(Boolean(capabilities.torch));
      } catch {
        setTorchAvailable(false);
      }
    } catch (error) {
      await stop();
      if (mountedRef.current) classifyError(error);
    }
  }, [classifyError, disabled, elementId, onScan, state, stop]);

  const switchCamera = async () => {
    if (cameras.length < 2) return;
    const next = (cameraIndex + 1) % cameras.length;
    setCameraIndex(next);
    await start(cameras[next]?.id);
  };

  const toggleTorch = async () => {
    const scanner = scannerRef.current;
    if (!scanner || !torchAvailable) return;
    const next = !torchOn;
    try {
      await scanner.applyVideoConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] });
      setTorchOn(next);
    } catch {
      setTorchAvailable(false);
      setMessage("Flash is not available for this camera. Scanning is still active.");
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      void stop();
    };
  }, [stop]);

  return (
    <section className="overflow-hidden rounded-3xl bg-[#111a2b] p-4 text-white shadow-[0_24px_70px_rgba(17,26,43,0.22)] sm:p-6" aria-labelledby="camera-heading">
      <div className="flex items-center justify-between gap-3">
        <div><p className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-emerald-300">Secure camera</p><h2 id="camera-heading" className="mt-1 text-lg font-bold">Scan booking QR</h2></div>
        <span className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/80"><span className={`size-2 rounded-full ${state === "scanning" ? "bg-emerald-300 motion-safe:animate-pulse" : "bg-white/35"}`} />{scannerLabel(state)}</span>
      </div>

      <div className="relative mt-5 aspect-square max-h-[34rem] w-full overflow-hidden rounded-2xl border border-white/15 bg-[#182338]">
        <div id={elementId} className="guard-scanner absolute inset-0" />
        {state !== "scanning" && state !== "scanned" && (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <div><span className="mx-auto grid size-16 place-items-center rounded-3xl bg-white/8 text-white/65">{state === "requesting" ? <Loader2 className="size-7 animate-spin" /> : state === "denied" || state === "unavailable" ? <CameraOff className="size-7" /> : <Camera className="size-7" />}</span><p className="mx-auto mt-4 max-w-xs text-sm leading-6 text-white/65">{message}</p></div>
          </div>
        )}
        {state === "scanning" && <div aria-hidden="true" className="pointer-events-none absolute inset-[12%] rounded-2xl border-2 border-emerald-300/80 shadow-[0_0_0_999px_rgba(6,12,24,0.26)]"><span className="absolute -left-0.5 -top-0.5 size-7 rounded-tl-xl border-l-4 border-t-4 border-emerald-300" /><span className="absolute -right-0.5 -top-0.5 size-7 rounded-tr-xl border-r-4 border-t-4 border-emerald-300" /><span className="absolute -bottom-0.5 -left-0.5 size-7 rounded-bl-xl border-b-4 border-l-4 border-emerald-300" /><span className="absolute -bottom-0.5 -right-0.5 size-7 rounded-br-xl border-b-4 border-r-4 border-emerald-300" /></div>}
      </div>

      <p role="status" aria-live="polite" className="mt-4 min-h-10 text-center text-sm leading-5 text-white/70">{message}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {state !== "scanning" ? <Button type="button" size="lg" onClick={() => void start()} disabled={disabled || state === "requesting"} className="min-h-11 bg-emerald-300 px-5 text-emerald-950 hover:bg-emerald-200"><Camera className="size-4" />{state === "requesting" ? "Starting camera…" : state === "idle" ? "Start camera" : "Retry camera"}</Button> : <Button type="button" size="lg" variant="outline" onClick={() => { void stop(); setState("idle"); setMessage("Camera stopped. Start it again when ready."); }} className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><CameraOff className="size-4" />Stop camera</Button>}
        {state === "scanning" && cameras.length > 1 && <Button type="button" size="lg" variant="outline" onClick={() => void switchCamera()} className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><SwitchCamera className="size-4" />Switch</Button>}
        {state === "scanning" && torchAvailable && <Button type="button" size="lg" variant="outline" onClick={() => void toggleTorch()} aria-pressed={torchOn} className="min-h-11 border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"><Flashlight className="size-4" />{torchOn ? "Flash off" : "Flash on"}</Button>}
        {(state === "denied" || state === "error") && <Button type="button" size="lg" variant="ghost" onClick={() => void start()} className="min-h-11 text-white hover:bg-white/10 hover:text-white"><RefreshCw className="size-4" />Try again</Button>}
      </div>
    </section>
  );
}

function scannerLabel(state: ScannerState) {
  if (state === "requesting") return "Starting";
  if (state === "scanning") return "Ready to scan";
  if (state === "scanned") return "Code detected";
  if (state === "denied") return "Permission blocked";
  if (state === "unavailable") return "Camera unavailable";
  if (state === "error") return "Needs attention";
  return "Camera off";
}
