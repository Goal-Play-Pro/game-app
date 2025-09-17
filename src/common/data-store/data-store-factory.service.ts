import { Injectable } from '@nestjs/common';
import { JsonDataStoreService } from '../services/json-data-store.service';
import { BaseEntity } from '../types/base.types';

/**
 * Factory service para crear instancias de JsonDataStoreService
 * Solución alternativa usando el patrón Factory
 */
@Injectable()
export class DataStoreFactory {
  private readonly stores = new Map<string, JsonDataStoreService<any>>();

  /**
   * Crea o retorna una instancia existente de JsonDataStoreService
   */
  createStore<T extends BaseEntity>(fileName: string): JsonDataStoreService<T> {
    if (!this.stores.has(fileName)) {
      this.stores.set(fileName, new JsonDataStoreService<T>(fileName));
    }
    return this.stores.get(fileName)!;
  }

  /**
   * Limpia todas las instancias almacenadas (útil para testing)
   */
  clearStores(): void {
    this.stores.clear();
  }
}