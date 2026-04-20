import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef();

export function navigate(name: string, params?: any) {
  console.log('🔍 Navigate called:', {
    name,
    params,
    isReady: navigationRef.isReady(),
  });

  if (navigationRef.isReady()) {
    console.log('✅ Navigation ref is ready, navigating...');
    navigationRef.navigate(name as never, params as never);
  } else {
    console.warn('⚠️ Navigation ref is NOT ready!');
  }
}
