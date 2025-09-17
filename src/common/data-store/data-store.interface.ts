export interface DataStore<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, data: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
  findWhere(predicate: (item: T) => boolean): Promise<T[]>;
  findOne(predicate: (item: T) => boolean): Promise<T | null>;
  upsert(id: string, data: Partial<T>): Promise<T>;
  count(): Promise<number>;
  exists(id: string): Promise<boolean>;
}

export interface FileDataStore<T> extends DataStore<T> {
  backup(): Promise<void>;
  restore(backupPath: string): Promise<void>;
  validate(): Promise<boolean>;
}