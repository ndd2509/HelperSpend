import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screen/HomeScreen';
import { TransactionsScreen } from '../screen/TransactionsScreen';
import DepositRequestScreen from '../screen/DepositRequestScreen';
import { DepositSuccessScreen } from '../screen/DepositSuccessScreen';
import { AddTransactionScreen } from '../screen/AddTransactionScreen';
import { SelectCategoryScreen } from '../screen/SelectCategoryScreen';
import QRPaymentScreen from '../screen/QRPaymentScreen';

const Stack = createNativeStackNavigator();

export const HomeStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
      <Stack.Screen name="DepositRequest" component={DepositRequestScreen} />
      <Stack.Screen name="DepositSuccess" component={DepositSuccessScreen} />
      <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
      <Stack.Screen name="SelectCategory" component={SelectCategoryScreen} />
      <Stack.Screen name="QRPayment" component={QRPaymentScreen} />
    </Stack.Navigator>
  );
};
