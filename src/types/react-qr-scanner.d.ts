declare module 'react-qr-scanner' {
  interface QrScannerProps {
    delay?: number;
    style?: React.CSSProperties;
    onError?: (error: any) => void;
    onScan?: ((result: { text: string } | null) => void) | null;
    constraints?: MediaStreamConstraints;
    facingMode?: 'user' | 'environment';
  }

  const QrScanner: React.ComponentType<QrScannerProps>;
  export default QrScanner;
}
