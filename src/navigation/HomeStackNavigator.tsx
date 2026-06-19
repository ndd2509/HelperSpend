import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen } from '../screen/HomeScreen';
import { TransactionsScreen } from '../screen/TransactionsScreen';
import DepositRequestScreen from '../screen/DepositRequestScreen';
import { DepositSuccessScreen } from '../screen/DepositSuccessScreen';
import { AddTransactionScreen } from '../screen/AddTransactionScreen';
import { SelectCategoryScreen } from '../screen/SelectCategoryScreen';
import QRPaymentScreen from '../screen/QRPaymentScreen';
import { AccountListScreen } from '../screen/AccountListScreen';
import BalanceDetailScreen from '../screen/BalanceDetailScreen';
import { CreateAccountScreen } from '../screen/CreateAccountScreen';
import { EditAccountScreen } from '../screen/EditAccountScreen';
import { SelectAccountScreen } from '../screen/SelectAccountScreen';
import { LenderPickerScreen } from '../screen/LenderPickerScreen';
import DebtPaymentScreen from '../screen/DebtPaymentScreen';
import LendingScreen from '../screen/LendingScreen';

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
      <Stack.Screen name="SelectAccount" component={SelectAccountScreen} />
      <Stack.Screen name="QRPayment" component={QRPaymentScreen} />
      <Stack.Screen name="AccountList" component={AccountListScreen} />
      <Stack.Screen name="BalanceDetailScreen" component={BalanceDetailScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="EditAccount" component={EditAccountScreen} />
      <Stack.Screen name="LenderPicker" component={LenderPickerScreen} />
      <Stack.Screen name="DebtPayment" component={DebtPaymentScreen} />
      <Stack.Screen name="Lending" component={LendingScreen} />
    </Stack.Navigator>
  );
};
