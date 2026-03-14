import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSubscription } from '../../hooks/useSubscription';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const { data: subscription, isLoading: subLoading } = useSubscription();

  if (isLoading || (user && subLoading)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <svg className="animate-spin w-8 h-8 text-accent" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!user.emailVerified) {
    return <Navigate to="/verify-email-pending" replace />;
  }

  // Check subscription — admins bypass
  if (user.role !== 'ADMIN' && subscription) {
    const active = ['TRIALING', 'ACTIVE'].includes(subscription.status);
    const trialExpired = subscription.status === 'TRIALING' &&
      subscription.trialEndsAt &&
      new Date(subscription.trialEndsAt) < new Date();

    if (!active || trialExpired) {
      return <Navigate to="/pricing" replace />;
    }
  }

  return <>{children}</>;
}
