"use client";

import type { MutableRefObject } from "react";
import { parseRealtimeMessage, postIceCandidate, postOffer } from "@/lib/signaling";
import type { RealtimeInboundEvent } from "@/lib/signaling";

export type JarvisPeerConfig = {
  audioElementRef: MutableRefObject<HTMLAudioElement | null>;
  onEvent: (event: RealtimeInboundEvent) => void;
  onConnectionStateChange?: (state: RTCPeerConnectionState) => void;
  onIceGatheringStateChange?: (state: RTCIceGatheringState) => void;
};

export type JarvisPeer = {
  pc: RTCPeerConnection;
  dc: RTCDataChannel;
  sessionId: string;
};

const defaultIceServers: RTCIceServer[] = [
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:global.stun.twilio.com:3478?transport=udp" }
];

export async function createJarvisPeer(
  localStream: MediaStream,
  config: JarvisPeerConfig
): Promise<JarvisPeer> {
  const pc = new RTCPeerConnection({ iceServers: defaultIceServers });
  let sessionId: string | null = null;

  localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));

  const dataChannel = pc.createDataChannel("jarvis-sidecar");
  dataChannel.binaryType = "arraybuffer";
  dataChannel.addEventListener("message", (event) => {
    const parsed = parseRealtimeMessage(event as MessageEvent<string>);
    if (parsed) config.onEvent(parsed);
  });

  pc.addEventListener("connectionstatechange", () => {
    config.onConnectionStateChange?.(pc.connectionState);
  });

  pc.addEventListener("icegatheringstatechange", () => {
    config.onIceGatheringStateChange?.(pc.iceGatheringState);
  });

  pc.addEventListener("icecandidate", async (event) => {
    if (event.candidate && sessionId) {
      try {
        await postIceCandidate({ ...event.candidate.toJSON(), sessionId });
      } catch (error) {
        console.error("Failed to post ICE candidate", error);
      }
    }
  });

  pc.addEventListener("track", (event) => {
    const [remoteStream] = event.streams;
    if (!remoteStream) return;
    if (config.audioElementRef.current) {
      config.audioElementRef.current.srcObject = remoteStream;
    }
  });

  const offer = await pc.createOffer({ offerToReceiveAudio: true });
  await pc.setLocalDescription(offer);

  const { answer, sessionId: id, iceServers } = await postOffer(pc.localDescription!.toJSON());
  sessionId = id;

  if (iceServers?.length) {
    const merged = { ...pc.getConfiguration(), iceServers: [...defaultIceServers, ...iceServers] };
    pc.setConfiguration(merged);
  }

  await pc.setRemoteDescription(new RTCSessionDescription(answer));

  return {
    pc,
    dc: dataChannel,
    sessionId
  };
}

export function closeJarvisPeer(peer: JarvisPeer | null) {
  if (!peer) return;
  try {
    peer.dc.close();
  } catch (error) {
    console.warn("Failed to close data channel", error);
  }
  peer.pc.getSenders().forEach((sender) => {
    try {
      sender.track?.stop();
    } catch (error) {
      console.warn("Failed to stop sender", error);
    }
  });
  peer.pc.close();
}

export function sendControl(peer: JarvisPeer | null, payload: unknown) {
  if (!peer?.dc || peer.dc.readyState !== "open") return;
  peer.dc.send(JSON.stringify(payload));
}
