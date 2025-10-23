import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Auth screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';

// Main screens (to be created)
import { DashboardScreen } from '../screens/DashboardScreen';
import { StudentsScreen } from '../screens/StudentsScreen';
import { OrdersScreen } from '../screens/OrdersScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Import screens (to be created)
import { ExcelUploadScreen } from '../screens/import/ExcelUploadScreen';
import { PhotoUploadScreen } from '../screens/import/PhotoUploadScreen';

// Template screens (to be created)
import { TemplateGalleryScreen } from '../screens/templates/TemplateGalleryScreen';

// Student screens (to be created)
import { AddStudentScreen } from '../screens/students/AddStudentScreen';
import { StudentListScreen } from '../screens/students/StudentListScreen';

import { AuthUser } from '../services/authService';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  AddStudent: undefined;
  StudentList: undefined;
  ExcelUpload: undefined;
  PhotoUpload: undefined;
  TemplateGallery: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Students: undefined;
  Orders: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainTabsProps {
  user: AuthUser;
}

const MainTabs: React.FC<MainTabsProps> = ({ user }) => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Students') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Orders') {
            iconName = focused ? 'receipt' : 'receipt-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          } else {
            iconName = 'help-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#ffffff',
          borderBottomWidth: 1,
          borderBottomColor: '#e5e7eb',
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: '600',
          color: '#1f2937',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Dashboard' }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{ title: 'Students' }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Orders' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

interface AppNavigatorProps {
  user: AuthUser | null;
  onLoginSuccess: (user: AuthUser) => void;
  onLogout: () => void;
}

export const AppNavigator: React.FC<AppNavigatorProps> = ({
  user,
  onLoginSuccess,
  onLogout,
}) => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main">
              {() => <MainTabs user={user} />}
            </Stack.Screen>
            <Stack.Screen
              name="AddStudent"
              component={AddStudentScreen}
              options={{ title: 'Add Student', headerShown: true }}
            />
            <Stack.Screen
              name="StudentList"
              component={StudentListScreen}
              options={{ title: 'Student List', headerShown: true }}
            />
            <Stack.Screen
              name="ExcelUpload"
              component={ExcelUploadScreen}
              options={{ title: 'Upload Excel', headerShown: true }}
            />
            <Stack.Screen
              name="PhotoUpload"
              component={PhotoUploadScreen}
              options={{ title: 'Upload Photos', headerShown: true }}
            />
            <Stack.Screen
              name="TemplateGallery"
              component={TemplateGalleryScreen}
              options={{ title: 'Select Template', headerShown: true }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login">
              {() => (
                <LoginScreen
                  onLoginSuccess={onLoginSuccess}
                  onNavigateToRegister={() => {}}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Register">
              {() => (
                <RegisterScreen
                  onRegisterSuccess={onLoginSuccess}
                  onNavigateToLogin={() => {}}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};
