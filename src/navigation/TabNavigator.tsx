import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '@/components/Screen';
import { Typography } from '@/components/Typography';
import { Button } from '@/components/Button';
import { useTheme } from '@/theme/useTheme';
import { useThemeStore } from '@/hooks/useThemeStore';
import { DashboardEntryScreen } from '@/screens/dashboard/DashboardEntryScreen';
import { CategoryListScreen } from '@/screens/categories/CategoryListScreen';
import { CategoryFormScreen } from '@/screens/categories/CategoryFormScreen';
import { ProductListScreen } from '@/screens/products/ProductListScreen';
import { ProductFormScreen } from '@/screens/products/ProductFormScreen';
import { StoreListScreen } from '@/screens/stores/StoreListScreen';
import { StoreFormScreen } from '@/screens/stores/StoreFormScreen';
import { PurchaseListScreen } from '@/screens/purchases/PurchaseListScreen';
import { PurchaseCreateScreen } from '@/screens/purchases/PurchaseCreateScreen';
import { PurchaseDetailScreen } from '@/screens/purchases/PurchaseDetailScreen';
import { PurchaseGroupListScreen } from '@/screens/purchase-groups/PurchaseGroupListScreen';
import { PurchaseGroupCreateScreen } from '@/screens/purchase-groups/PurchaseGroupCreateScreen';
import { PurchaseGroupDetailScreen } from '@/screens/purchase-groups/PurchaseGroupDetailScreen';
import type {
  BottomTabParamList,
  DashboardStackParamList,
  CategoryStackParamList,
  ProductStackParamList,
  StoreStackParamList,
  PurchaseStackParamList,
  PurchaseGroupStackParamList,
} from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export function SettingsScreen() {
  const { mode, setMode } = useThemeStore();
  return (
    <Screen>
      <Typography variant="h1">Settings</Typography>
      <Button onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')} testID="dark-mode-toggle">
        Toggle Dark Mode
      </Button>
    </Screen>
  );
}

const DashboardStack = createNativeStackNavigator<DashboardStackParamList>();
function DashboardStackNavigator() {
  return (
    <DashboardStack.Navigator screenOptions={{ headerShown: false }}>
      <DashboardStack.Screen name="DashboardEntry" component={DashboardEntryScreen} />
    </DashboardStack.Navigator>
  );
}

const CategoryStack = createNativeStackNavigator<CategoryStackParamList>();
function CategoryStackNavigator() {
  return (
    <CategoryStack.Navigator screenOptions={{ headerShown: false }}>
      <CategoryStack.Screen name="CategoryList" component={CategoryListScreen} />
      <CategoryStack.Screen name="CategoryForm" component={CategoryFormScreen} />
    </CategoryStack.Navigator>
  );
}

const ProductStack = createNativeStackNavigator<ProductStackParamList>();
function ProductStackNavigator() {
  return (
    <ProductStack.Navigator screenOptions={{ headerShown: false }}>
      <ProductStack.Screen name="ProductList" component={ProductListScreen} />
      <ProductStack.Screen name="ProductForm" component={ProductFormScreen} />
    </ProductStack.Navigator>
  );
}

const StoreStack = createNativeStackNavigator<StoreStackParamList>();
function StoreStackNavigator() {
  return (
    <StoreStack.Navigator screenOptions={{ headerShown: false }}>
      <StoreStack.Screen name="StoreList" component={StoreListScreen} />
      <StoreStack.Screen name="StoreForm" component={StoreFormScreen} />
    </StoreStack.Navigator>
  );
}

const PurchaseStack = createNativeStackNavigator<PurchaseStackParamList>();
function PurchaseStackNavigator() {
  return (
    <PurchaseStack.Navigator screenOptions={{ headerShown: false }}>
      <PurchaseStack.Screen name="PurchaseList" component={PurchaseListScreen} />
      <PurchaseStack.Screen name="PurchaseCreate" component={PurchaseCreateScreen} />
      <PurchaseStack.Screen name="PurchaseDetail" component={PurchaseDetailScreen} />
    </PurchaseStack.Navigator>
  );
}

const PurchaseGroupStack = createNativeStackNavigator<PurchaseGroupStackParamList>();
function PurchaseGroupStackNavigator() {
  return (
    <PurchaseGroupStack.Navigator screenOptions={{ headerShown: false }}>
      <PurchaseGroupStack.Screen name="PurchaseGroupList" component={PurchaseGroupListScreen} />
      <PurchaseGroupStack.Screen name="PurchaseGroupCreate" component={PurchaseGroupCreateScreen} />
      <PurchaseGroupStack.Screen name="PurchaseGroupDetail" component={PurchaseGroupDetailScreen} />
    </PurchaseGroupStack.Navigator>
  );
}

export function TabNavigator() {
  const theme = useTheme();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textSecondary,
        tabBarStyle: { borderTopWidth: 0, elevation: 0 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Categories"
        component={CategoryStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Products"
        component={ProductStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Stores"
        component={StoreStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="storefront-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Purchases"
        component={PurchaseStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="cart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="PurchaseGroups"
        component={PurchaseGroupStackNavigator}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="folder-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }: { color: string; size: number }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
