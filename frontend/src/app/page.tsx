'use client';

import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { AuthButton } from "@/components/AuthButton";
import { Dashboard } from "@/components/Dashboard";
import { OnboardingScreen } from "@/components/OnboardingScreen";
import styles from "./page.module.css";

export default function Home() {
  const { authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [userExists, setUserExists] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUserExists = async () => {
      if (!authenticated || !wallets.length) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/users/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ address: wallets[0].address }),
        });

        const data = await response.json();
        setUserExists(data.exists);
      } catch (error) {
        console.error('Error checking if user exists:', error);
        // Default to false if there's an error
        setUserExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (authenticated && wallets.length > 0) {
      checkUserExists();
    } else if (ready) {
      setIsLoading(false);
    }
  }, [authenticated, wallets, ready]);

  // Show loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        {/* <p>Loading...</p> */}
      </div>
    );
  }

  // Not authenticated - show landing page
  if (!authenticated) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>
            ChainSocial
          </h1>
          
          <p className={styles.subtitle}>
            Join the next generation of social networking on Monad.
          </p>

          <div className={styles.authSection}>
            <AuthButton />
            
            <div className={styles.disclaimer}>
              By signing up, you agree to our Terms of Service and Privacy Policy.
            </div>
          </div>

          <div className={styles.features}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Lightning Fast</h3>
              <p className={styles.featureText}>Experience social at the speed of Monad.</p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Decentralized</h3>
              <p className={styles.featureText}>Own your content and identity.</p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Community First</h3>
              <p className={styles.featureText}>Connect with like-minded individuals.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated but doesn't exist in our system - show onboarding
  if (!userExists) {
    return <OnboardingScreen />;
  }

  // User exists - show dashboard
  return <Dashboard />;
}
