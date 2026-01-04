import { fetchSTT } from "@/lib";
import { UseCompletionReturn } from "@/types";
import { useMicVAD } from "@ricky0123/vad-react";
import { LoaderCircleIcon, MicIcon, MicOffIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components";
import { useApp } from "@/contexts";
import { floatArrayToWav } from "@/lib/utils";
import { shouldUsePluelyAPI } from "@/lib/functions/pluely.api";

interface AutoSpeechVADProps {
  submit: UseCompletionReturn["submit"];
  setState: UseCompletionReturn["setState"];
  setEnableVAD: UseCompletionReturn["setEnableVAD"];
  microphoneDeviceId: string;
}

const AutoSpeechVADInternal = ({
  submit,
  setState,
  setEnableVAD,
  microphoneDeviceId,
}: AutoSpeechVADProps) => {
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { selectedSttProvider, allSttProviders } = useApp();

  const audioConstraints: MediaTrackConstraints = microphoneDeviceId
    ? { deviceId: { exact: microphoneDeviceId } }
    : { deviceId: "default" };

  const vad = useMicVAD({
    userSpeakingThreshold: 0.6,
    startOnLoad: true,
    additionalAudioConstraints: audioConstraints,
    onSpeechEnd: async (audio) => {
      try {
        // convert float32array to blob
        const audioBlob = floatArrayToWav(audio, 16000, "wav");

        let transcription: string;
        const usePluelyAPI = await shouldUsePluelyAPI();

        // Check if we have a configured speech provider
        if (!selectedSttProvider.provider && !usePluelyAPI) {
          console.warn("No speech provider selected");
          setState((prev: any) => ({
            ...prev,
            error:
              "No speech provider selected. Please select one in settings.",
          }));
          return;
        }

        const providerConfig = allSttProviders.find(
          (p) => p.id === selectedSttProvider.provider
        );

        if (!providerConfig && !usePluelyAPI) {
          console.warn("Selected speech provider configuration not found");
          setState((prev: any) => ({
            ...prev,
            error:
              "Speech provider configuration not found. Please check your settings.",
          }));
          return;
        }

        setIsTranscribing(true);

        // Use the fetchSTT function for all providers
        transcription = await fetchSTT({
          provider: usePluelyAPI ? undefined : providerConfig,
          selectedProvider: selectedSttProvider,
          audio: audioBlob,
        });

        if (transcription) {
          // Wrap the transcription with the system prompt context for voice input
          const prompt = `You are a spoken-input technical interpreter for technical interviews.

Your role is to interpret spoken language as an implicit technical question — even if the user phrases it like an answer, confirmation, or self-talk.

CRITICAL DECISION LOGIC:
1. **CODING REQUESTS**: If the user describes a problem, algorithm, function, or logic check -> **Output ONLY valid, optimized Python code**. No explanations.
2. **THEORY/INTERVIEW QUESTIONS**: If the user asks about concepts, differences, system design, or definitions -> **Output a paragraph answer using Bangalore/Bengaluru tech slang**. Do NOT use bullet points. Use terms like "macha", "da", "scene", "fundae", "simply".

SPECIAL RULES:
- If the spoken input sounds like the user is *confirming* or *repeating* a solution (e.g., “so the output should be c, right?”), you MUST interpret it as a request to IMPLEMENT or VALIDATE that logic with CODE.
- Lists spoken verbally (e.g., “a comma b comma c”) → treat as arrays or lists.
- Repeated elements imply frequency/count problems.
- “So the output must be X” → verify by implementing logic.
- Always assume Python unless explicitly stated otherwise.

EXAMPLE INPUT (spoken):
"So let me understand the question so uh if I list a comma b comma c comma c comma c the output must be c correct"

INTERNAL INTERPRETATION:
→ Find the most frequent element in a list.

EXPECTED OUTPUT:
→ Python function that returns the most frequent element.

EXAMPLES:
- Input: "So I need to find the duplicate number." -> Output: [Python Code Solution]
- Input: "What is the difference between TCP and UDP?" -> Output: "See macha, TCP is reliable connection-oriented scene, full handshake and all. UDP is simply fire and forget, good for streaming da."

Spoken Input: "${transcription}"`;
          submit(prompt);
        }
      } catch (error) {
        console.error("Failed to transcribe audio:", error);
        setState((prev: any) => ({
          ...prev,
          error:
            error instanceof Error ? error.message : "Transcription failed",
        }));
      } finally {
        setIsTranscribing(false);
      }
    },
  });

  return (
    <>
      <Button
        size="icon"
        onClick={() => {
          if (vad.listening) {
            vad.pause();
            setEnableVAD(false);
          } else {
            vad.start();
            setEnableVAD(true);
          }
        }}
        className="cursor-pointer"
      >
        {isTranscribing ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin text-green-500" />
        ) : vad.userSpeaking ? (
          <LoaderCircleIcon className="h-4 w-4 animate-spin" />
        ) : vad.listening ? (
          <MicOffIcon className="h-4 w-4 animate-pulse" />
        ) : (
          <MicIcon className="h-4 w-4" />
        )}
      </Button>
    </>
  );
};

export const AutoSpeechVAD = (props: AutoSpeechVADProps) => {
  return <AutoSpeechVADInternal key={props.microphoneDeviceId} {...props} />;
};
