import React from 'react';
import styles from './MobileContainer.module.css';

function MobileContainer({ children }) {
  return (
    <div className={styles.mobileContainer}>
      {children}
    </div>
  );
}

export default MobileContainer;
