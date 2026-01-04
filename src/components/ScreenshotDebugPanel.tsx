import { useState } from "react";
import { debugScreenshotCapture, getMacOSPermissionResetInstructions } from "@/utils/screenshotDebug";

interface DebugResult {
  platform?: string;
  timestamp?: string;
  screenRecordingPermission?: boolean;
  screenRecordingPermissionError?: string;
  captureToBase64?: {
    success: boolean;
    dataLength?: number;
    error?: string;
  };
  startScreenCapture?: {
    success: boolean;
    error?: string;
  };
}

export function ScreenshotDebugPanel() {
  const [debugResults, setDebugResults] = useState<DebugResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [showResetInstructions, setShowResetInstructions] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    try {
      const results = await debugScreenshotCapture();
      setDebugResults(results);
    } catch (error) {
      console.error("Diagnostics failed:", error);
      setDebugResults({ 
        platform: navigator.platform,
        captureToBase64: { 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  const handleShowResetInstructions = () => {
    setShowResetInstructions(true);
  };

  const resetInstructions = getMacOSPermissionResetInstructions();

  return (
    <div className="space-y-4 p-4 bg-gray-900 rounded-lg">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Screenshot Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md text-sm"
        >
          {isRunning ? "Running..." : "Run Diagnostics"}
        </button>
      </div>

      {debugResults && (
        <div className="space-y-3">
          <div className="text-sm">
            <div className="text-gray-400">Platform:</div>
            <div className="text-white font-mono">{debugResults.platform}</div>
          </div>

          {debugResults.screenRecordingPermission !== undefined && (
            <div className="text-sm">
              <div className="text-gray-400">Screen Recording Permission:</div>
              <div className={`font-mono ${debugResults.screenRecordingPermission ? "text-green-400" : "text-red-400"}`}>
                {debugResults.screenRecordingPermission ? "✓ Granted" : "✗ Not Granted"}
              </div>
            </div>
          )}

          {debugResults.screenRecordingPermissionError && (
            <div className="text-sm">
              <div className="text-gray-400">Permission Check Error:</div>
              <div className="text-red-400 font-mono text-xs">{debugResults.screenRecordingPermissionError}</div>
            </div>
          )}

          {debugResults.captureToBase64 && (
            <div className="text-sm">
              <div className="text-gray-400">Full Screen Capture:</div>
              <div className={`font-mono ${debugResults.captureToBase64.success ? "text-green-400" : "text-red-400"}`}>
                {debugResults.captureToBase64.success 
                  ? `✓ Success (${debugResults.captureToBase64.dataLength} bytes)`
                  : `✗ Failed: ${debugResults.captureToBase64.error}`}
              </div>
            </div>
          )}

          {debugResults.startScreenCapture && (
            <div className="text-sm">
              <div className="text-gray-400">Selection Overlay:</div>
              <div className={`font-mono ${debugResults.startScreenCapture.success ? "text-green-400" : "text-red-400"}`}>
                {debugResults.startScreenCapture.success 
                  ? "✓ Success"
                  : `✗ Failed: ${debugResults.startScreenCapture.error}`}
              </div>
            </div>
          )}
        </div>
      )}

      {navigator.platform.toLowerCase().includes("mac") && (
        <div className="pt-4 border-t border-gray-700">
          <button
            onClick={handleShowResetInstructions}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Reset macOS Permissions (if stuck)
          </button>

          {showResetInstructions && !resetInstructions.error && (
            <div className="mt-3 p-3 bg-gray-800 rounded text-sm space-y-2">
              <div className="text-gray-300">{resetInstructions.message}</div>
              <div className="space-y-1">
                {resetInstructions.commands?.map((cmd, idx) => (
                  <div key={idx} className="font-mono text-xs text-green-400 bg-black p-2 rounded">
                    {cmd}
                  </div>
                ))}
              </div>
              <div className="text-gray-400 text-xs italic">{resetInstructions.note}</div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
        <p>Check the developer console (View → Toggle Developer Tools) for detailed logs.</p>
      </div>
    </div>
  );
}