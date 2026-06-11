import type { BottomTabParamList, RootStackParamList } from '../types';

describe('Navigation Types', () => {
  it('BottomTabParamList has 7 keys: Home, Categories, Products, Stores, Purchases, PurchaseGroups, Settings', () => {
    const keys: (keyof BottomTabParamList)[] = [
      'Home',
      'Categories',
      'Products',
      'Stores',
      'Purchases',
      'PurchaseGroups',
      'Settings',
    ];
    expect(keys).toHaveLength(7);
    type Assert = BottomTabParamList extends Record<string, undefined> ? true : false;
    const _assert: Assert = true;
    expect(_assert).toBe(true);
  });

  it('RootStackParamList has Auth and MainTabs keys', () => {
    const keys: (keyof RootStackParamList)[] = ['Auth', 'MainTabs'];
    expect(keys).toHaveLength(2);
    type Assert = RootStackParamList extends Record<string, undefined> ? true : false;
    const _assert: Assert = true;
    expect(_assert).toBe(true);
  });

  it('all param values are undefined', () => {
    const _bottomTabParams: BottomTabParamList = {
      Home: undefined,
      Categories: undefined,
      Products: undefined,
      Stores: undefined,
      Purchases: undefined,
      PurchaseGroups: undefined,
      Settings: undefined,
    };
    const _rootStackParams: RootStackParamList = {
      Auth: undefined,
      MainTabs: undefined,
    };
    expect(_bottomTabParams).toBeDefined();
    expect(_rootStackParams).toBeDefined();
  });
});
