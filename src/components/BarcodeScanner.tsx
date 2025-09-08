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
  manualScan = false, // Nova prop para controle manual
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
  manualScan?: boolean; // Nova prop
}): React.ReactElement => {
  const webcamRef = useRef<Webcam>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isScanning, setIsScanning] = useState(!manualScan); // Se manual, não inicia automaticamente
  const [waitingToScan, setWaitingToScan] = useState(false); // Estado para mostrar que está aguardando scan manual

  const capture = useCallback(() => {
    console.log('📸 capture chamada - isScanning:', isScanning, 'waitingToScan:', waitingToScan);
    // Para modo manual, sempre permitir se waitingToScan for true
    // Para modo automático, verificar isScanning
    if (manualScan) {
      if (!waitingToScan) {
        console.log('❌ Capture cancelada - modo manual mas não está aguardando scan');
        return;
      }
    } else {
      if (!isScanning) {
        console.log('❌ Capture cancelada - modo automático mas não está escaneando');
        return;
      }
    }
    
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
          setWaitingToScan(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          
          onUpdate(null, result);
          
          // Se for modo manual, não reinicia automaticamente
          if (!manualScan) {
            // Reiniciar após 3 segundos apenas no modo automático
            setTimeout(() => {
              console.log('📱 Reiniciando scanner...');
              setIsScanning(true);
            }, 3000);
          }
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
  }, [onUpdate, formats, isScanning, waitingToScan, manualScan]);

  // Função para scan manual
  const performManualScan = useCallback(() => {
    console.log('🔍 performManualScan chamada - manualScan:', manualScan, 'waitingToScan:', waitingToScan);
    if (manualScan && !waitingToScan) {
      console.log('📱 Realizando scan manual...');
      setWaitingToScan(true);
      
      // Após o scan manual, resetar estado
      setTimeout(() => {
        console.log('⏰ Timeout de scan manual executado');
        setWaitingToScan(false);
      }, 3000); // Aumentar tempo para 3 segundos
    } else {
      console.log('❌ Condições não atendidas para scan manual');
    }
  }, [manualScan, waitingToScan]);

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
    // No modo automático, inicia o interval quando isScanning for true
    // No modo manual, executa uma única captura quando waitingToScan for true
    if (!manualScan && isScanning) {
      console.log('📱 Iniciando interval de escaneamento automático...');
      intervalRef.current = setInterval(capture, delay);
    } else if (manualScan && waitingToScan) {
      console.log('📱 Executando captura única no modo manual...');
      // No modo manual, executa apenas uma vez
      const timeout = setTimeout(capture, 100);
      return () => clearTimeout(timeout);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [capture, delay, isScanning, manualScan, waitingToScan]);

  return (
    <div className="relative w-full h-full">
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
        className="w-full h-full object-cover"
      />
      
      {/* Overlay para modo manual */}
      {manualScan && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative">
            {/* Quadrado de mira */}
            <div className="w-64 h-64 border-2 border-white/50 rounded-lg relative">
              {/* Cantos do scanner */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-green-400"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-green-400"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-green-400"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-green-400"></div>
              
              {/* Linha de scan animada quando escaneando */}
              {waitingToScan && (
                <div className="absolute inset-x-2 top-1/2 h-0.5 bg-green-400 animate-pulse"></div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Botão de escanear para modo manual */}
      {manualScan && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto">
          <button
            onClick={() => {
              console.log('🖱️ Botão Escanear clicado');
              performManualScan();
            }}
            disabled={waitingToScan}
            className={`px-6 py-3 rounded-full font-medium text-white shadow-lg transition-all duration-200 ${
              waitingToScan 
                ? 'bg-yellow-500 cursor-not-allowed' 
                : 'bg-green-500 hover:bg-green-600 active:scale-95'
            }`}
          >
            {waitingToScan ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Escaneando...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Escanear QRCode
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default BarcodeScanner;
