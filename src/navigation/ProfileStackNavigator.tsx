import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ProfileScreen } from '../screen/ProfileScreen';
import { ChangePasswordScreen } from '../screen/ChangePasswordScreen';
import { EditProfileScreen } from '../screen/EditProfileScreen';

const Stack = createNativeStackNavigator();

export const ProfileStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#00A8E8',
        headerTitleStyle: { fontWeight: '600', color: '#1A1A1A' },
        headerBackTitleVisible: false,
      }}
    >
      <Stack.Screen
        name="ProfileMain"
        component={ProfileScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Thông tin cá nhân' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: 'Đổi mật khẩu' }}
      />
    </Stack.Navigator>
  );
};
