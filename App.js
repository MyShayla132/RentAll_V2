import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";

// Import your screens from the Pages folder
import LoginScreen from "./Pages/LoginScreen";
import RegisterScreen from "./Pages/RegisterScreen";
import ForgotPasswordScreen from "./Pages/Recover";
import HomeScreen from "./Pages/HomeScreen";
import OtpScreen from "./Pages/Otp";
import ProfileDefault from "./Pages/ProfileDefault";
import InboxScreen from "./Pages/Inbox";
import PostItemsScreen from "./Pages/PostItems";
import NotificationScreen from "./Pages/Notification";
import ItemDetailsScreen from "./Pages/ItemDetails";
import RentingForm from "./Pages/RentingForm";
import EditProfile from "./Pages/EditProfile";
import LikedItemsScreen from "./Pages/LikedItems";
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Recover" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="Profile" component={ProfileDefault} />
        <Stack.Screen name="Inbox" component={InboxScreen} />
        <Stack.Screen name="PostItems" component={PostItemsScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="ItemDetails" component={ItemDetailsScreen} />
        <Stack.Screen name="RentingForm" component={RentingForm} />
        <Stack.Screen name="EditProfile" component={EditProfile} />
        <Stack.Screen name="LikedItems" component={LikedItemsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
