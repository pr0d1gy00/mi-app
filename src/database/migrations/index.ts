export interface Migration {
  name: string;
  up: string;
}

export { migration001CreateTables } from './001-create-tables';
export { migrations } from './runner';
