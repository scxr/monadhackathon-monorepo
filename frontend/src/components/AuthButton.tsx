'use client';

import { usePrivy } from '@privy-io/react-auth';
import styles from './AuthButton.module.css';

export function AuthButton() {
  const { login, logout, authenticated, user } = usePrivy();

  if (!authenticated) {
    return (
      <button
        onClick={login}
        className={styles.button}
      >
        Get Started
      </button>
    );
  }

  return (
    <div className={styles.userSection}>
      <div className={styles.userInfo}>
        <span className={styles.label}>Signed in as</span>
        <span className={styles.address}>
          {user?.email?.address || user?.wallet?.address}
        </span>
      </div>
      <button
        onClick={logout}
        className={styles.signOutButton}
      >
        Sign Out
      </button>
    </div>
  );
} 