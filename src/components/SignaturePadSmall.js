import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import styles from './SignaturePadSmall.module.css';

function SignaturePadSmall({ value, onChange }) {
  const sigRef = useRef();

  // Limpiar el canvas cuando el componente se monta o cambia de usuario
  useEffect(() => {
    if (sigRef.current) {
      sigRef.current.clear();
    }
  }, []);

  const handleClear = () => {
    if (sigRef.current) {
      sigRef.current.clear();
      onChange('');
    }
  };

  const handleEnd = () => {
    try {
      if (sigRef.current && !sigRef.current.isEmpty()) {
        const canvas = sigRef.current.getTrimmedCanvas();
        const dataURL = canvas.toDataURL('image/png');
        const base64 = dataURL.replace(/^data:image\/png;base64,/, '');
        onChange(base64);
      }
    } catch (error) {
      console.error('Error al procesar la firma:', error);
      onChange('');
    }
  };

  return (
    <div className={styles.signaturePad}>
      <SignatureCanvas
        ref={sigRef}
        penColor="#222"
        backgroundColor="#fff"
        canvasProps={{ 
          width: 220, 
          height: 60, 
          className: styles.sigCanvas 
        }}
        onEnd={handleEnd}
      />
      <div className={styles.signaturePadActions}>
        <button type="button" onClick={handleClear}>Limpiar</button>
      </div>
    </div>
  );
}

export default SignaturePadSmall;
