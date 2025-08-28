"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  BarcodeFormat,
  BrowserMultiFormatReader,
  DecodeHintType,
  Result,
} from "@zxing/library";
import Webcam from "react-webcam";
import { BarcodeStringFormat } from "./BarcodeStringFormat";

declare global {
  interface MediaTrackCapabilities {
    torch?: boolean;
  }
}

export const BarcodeScanner = ({
  onUpdate,
  onError,
  width = "100%",
  height = "100%",
  facingMode = "environment",
  torch,
  delay = 500,
  videoConstraints,
  stopStream,
  formats,
  shouldRestart = false,
}: {
  onUpdate: (arg0: unknown, arg1?: Result) => void;
  onError?: (arg0: string | DOMException) => void;
  width?: number | string;
  height?: number | string;
  facingMode?: "environment" | "user";
  torch?: boolean;
  delay?: number;
  videoConstraints?: MediaTrackConstraints;
  stopStream?: boolean;
  formats?: BarcodeFormat[] | BarcodeStringFormat[];
  shouldRestart?: boolean;
}): React.ReactElement => {
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  const capture = useCallback(() => {
    if (!isScanning) return;
    
    const codeReader = new BrowserMultiFormatReader(
      new Map([
        [
          DecodeHintType.POSSIBLE_FORMATS,
          formats?.map((f) => (typeof f === "string" ? BarcodeFormat[f] : f)),
        ],
      ])
    );
    const imageSrc = webcamRef?.current?.getScreenshot();
    if (imageSrc) {
      codeReader
        .decodeFromImage(undefined, imageSrc)
        .then((result) => {
          // Parar escaneamento quando encontrar um QR code
          console.log('📱 QR Code detectado, pausando scanner...');
          setIsScanning(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          onUpdate(null, result);
          
          // Reiniciar após 3 segundos
          setTimeout(() => {
            console.log('📱 Reiniciando scanner...');
            setIsScanning(true);
          }, 3000);
        })
        .catch((err) => {
          // Só chama onUpdate com erro se NÃO for NotFoundException (ZXing)
          if (err && err.name === 'NotFoundException') {
            // Não faz nada, apenas não encontrou QR/barcode
            return;
          }
          onUpdate(err);
        });
    }
  }, [onUpdate, formats, isScanning]);

  // Efeito para reiniciar quando shouldRestart muda
  useEffect(() => {
    if (shouldRestart) {
      console.log('📱 Reiniciando scanner por solicitação externa...');
      setIsScanning(true);
    }
  }, [shouldRestart]);

  useEffect(() => {
    // Turn on the flashlight if prop is defined and device has the capability
    if (
      typeof torch === "boolean" &&
      (
        navigator?.mediaDevices?.getSupportedConstraints() as MediaTrackSupportedConstraints & {
          torch?: boolean;
        }
      ).torch
    ) {
      const stream = webcamRef?.current?.video?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (track && track.getCapabilities().torch) {
        track
          .applyConstraints({
            advanced: [{ torch }] as unknown as MediaTrackConstraintSet[],
          })
          .catch((err: unknown) => onUpdate(err));
      }
    }
  }, [torch, onUpdate]);

  useEffect(() => {
    if (stopStream) {
      let stream = webcamRef?.current?.video?.srcObject as MediaStream | null;
      if (stream) {
        stream.getTracks().forEach((track) => {
          stream?.removeTrack(track);
          track.stop();
        });
        stream = null;
      }
    }
  }, [stopStream]);

  useEffect(() => {
    if (isScanning) {
      console.log('📱 Iniciando interval de escaneamento...');
      intervalRef.current = setInterval(capture, delay);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [capture, delay, isScanning]);

  return (
    <Webcam
      width={width}
      height={height}
      ref={webcamRef}
      screenshotFormat="image/jpeg"
      videoConstraints={
        videoConstraints || {
          facingMode,
        }
      }
      audio={false}
      onUserMediaError={onError}
      data-testid="video"
    />
  );
};

export default BarcodeScanner;
