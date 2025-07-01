import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from './SignaturePad.module.css';

function SignaturePad({ value, onChange }) {
  const sigRef = useRef();

  const handleClear = () => {
    sigRef.current.clear();
    onChange('');
  };

  const handleEnd = () => {
    try {
      if (!sigRef.current.isEmpty()) {
        const canvas = sigRef.current.getTrimmedCanvas();
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        onChange(base64);
      }
    } catch (error) {
      console.error('Error al procesar la firma:', error);
    }
  };

  return (
    <div className={styles.signaturePad}>
      <SignatureCanvas
        ref={sigRef}
        penColor="#222"
        backgroundColor="#fff"
        canvasProps={{ width: 320, height: 120, className: styles.sigCanvas }}
        onEnd={handleEnd}
      />
      <div className={styles.signaturePadActions}>
        <button type="button" onClick={handleClear}>Limpiar</button>
      </div>
    </div>
  );
}

export default SignaturePad;
