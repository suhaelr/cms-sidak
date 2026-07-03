import { Navigate } from 'react-router-dom';
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext';
import type { MenuFeatureFlag } from '@/lib/feature-flags';

type FeatureFlagRouteProps = {
  flag: MenuFeatureFlag;
  children: React.ReactNode;
  redirectTo?: string;
};

const FeatureFlagRoute = ({ flag, children, redirectTo = '/' }: FeatureFlagRouteProps) => {
  const { loading, isEnabled } = useFeatureFlags();

  if (loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isEnabled(flag)) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default FeatureFlagRoute;
