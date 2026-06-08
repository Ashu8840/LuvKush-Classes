import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeLandingScreen from "../screens/public/HomeLandingScreen";
import LoginScreen from "../screens/LoginScreen";

export type PublicStackParamList = {
  Home: undefined;
  Login: undefined;
};

const Stack = createNativeStackNavigator<PublicStackParamList>();

export default function PublicNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={HomeLandingScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
    </Stack.Navigator>
  );
}