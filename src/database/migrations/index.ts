export interface Migration {
  name: string;
  up: string;
}

export { migration001CreateTables } from './001-create-tables';
export { migration002CreatePurchases } from './002-create-purchases';
export { migration003CreatePurchaseGroups } from './003-create-purchase-groups';
export { migration004CreateExchangeRates } from './004-create-exchange-rates';
export { migration005CreateSyncMetadata } from './005-create-sync-metadata';
export { migrations } from './runner';
