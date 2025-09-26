import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...' }) => {
  return (
    <div className={`${styles['loading-spinner']} ${styles[size]}`}>
      <div className={styles.spinner}></div>
      {text && <p className={styles['loading-text']}>{text}</p>}
    </div>
  );
};

export default LoadingSpinner;