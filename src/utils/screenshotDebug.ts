import { invoke } from "@tauri-apps/api/core";

/**
 * Debug utility to check screenshot capture permissions and capabilities
 */
export async function debugScreenshotCapture() {
  const results: Record<string, any> = {
    platform: navigator.platform,
    timestamp: new Date().toISOString(),
  };

  // Check macOS permissions
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) {
    try {
      const { checkScreenRecordingPermission } = await import(
        "tauri-plugin-macos-permissions-api"
      );
      const hasPermission = await checkScreenRecordingPermission();
      results.screenRecordingPermission = hasPermission;
    } catch (error) {
      results.screenRecordingPermissionError = error instanceof Error ? error.message : String(error);
    }
  }

  // Test capture_to_base64 command
  try {
    const base64 = await invoke("capture_to_base64");
    results.captureToBase64 = {
      success: true,
      dataLength: (base64 as string).length,
    };
  } catch (error) {
    results.captureToBase64 = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // Test start_screen_capture command
  try {
    await invoke("start_screen_capture");
    results.startScreenCapture = { success: true };
  } catch (error) {
    results.startScreenCapture = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  console.log("Screenshot Debug Results:", results);
  return results;
}

/**
 * Get instructions to reset TCC (Transparency, Consent, and Control) database for screen recording
 * This can help resolve permission caching issues on macOS
 */
export function getMacOSPermissionResetInstructions() {
  const platform = navigator.platform.toLowerCase();
  if (!platform.includes("mac")) {
    return { error: "This function is only available on macOS" };
  }

  // Note: This requires user to run these commands manually in Terminal
  // as they need elevated privileges
  const commands = [
    "tccutil reset ScreenCapture com.pluely.app",
    "tccutil reset SystemPolicyAllFiles com.pluely.app",
  ];

  return {
    message: "Please run these commands in Terminal to reset permissions:",
    commands,
    note: "After running these commands, restart Pluely and grant permissions again.",
  };
}