import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileDataStore } from './data-store.interface';
import { BaseEntity } from '../types/base.types';

@Injectable()
export class JsonDataStoreService<T extends BaseEntity> implements FileDataStore<T> {
  private readonly logger = new Logger(JsonDataStoreService.name);
  private data: T[] = [];
  private readonly filePath: string;
  private readonly backupDir: string;

  constructor(private readonly fileName: string) {
    this.filePath = join(process.cwd(), 'data', `${fileName}.json`);
    this.backupDir = join(process.cwd(), 'data', 'backups');
    this.initializeDataFile();
  }

  private async initializeDataFile(): Promise<void> {
    try {
      // Crear directorios si no existen
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      // Cargar datos existentes o crear archivo vacío
      try {
        const fileContent = await fs.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(fileContent);
        this.logger.log(`Datos cargados desde ${this.fileName}.json: ${this.data.length} registros`);
      } catch (error) {
        this.data = [];
        await this.saveData();
        this.logger.log(`Archivo ${this.fileName}.json creado`);
      }
    } catch (error) {
      this.logger.error(`Error inicializando datos: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
    } catch (error) {
      this.logger.error(`Error guardando datos: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findAll(): Promise<T[]> {
    return [...this.data];
  }

  async findById(id: string): Promise<T | null> {
    return this.data.find(item => item.id === id) || null;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date();
    const newItem = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    } as T;

    this.data.push(newItem);
    await this.saveData();
    
    this.logger.debug(`Creado nuevo elemento: ${newItem.id}`);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Elemento con ID ${id} no encontrado`);
    }

    const updatedItem = {
      ...this.data[index],
      ...data,
      updatedAt: new Date(),
    };

    this.data[index] = updatedItem;
    await this.saveData();
    
    this.logger.debug(`Actualizado elemento: ${id}`);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    this.data.splice(index, 1);
    await this.saveData();
    
    this.logger.debug(`Eliminado elemento: ${id}`);
    return true;
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    return this.data.filter(predicate);
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    return this.data.find(predicate) || null;
  }

  async upsert(id: string, data: Partial<T>): Promise<T> {
    const existing = await this.findById(id);
    if (existing) {
      return this.update(id, data);
    }
    
    return this.create({ ...data, id } as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
  }

  async count(): Promise<number> {
    return this.data.length;
  }

  async exists(id: string): Promise<boolean> {
    return this.data.some(item => item.id === id);
  }

  async backup(): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.backupDir, `${this.fileName}-${timestamp}.json`);
    
    await fs.copyFile(this.filePath, backupPath);
    this.logger.log(`Backup creado: ${backupPath}`);
  }

  async restore(backupPath: string): Promise<void> {
    const fileContent = await fs.readFile(backupPath, 'utf-8');
    this.data = JSON.parse(fileContent);
    await this.saveData();
    
    this.logger.log(`Datos restaurados desde: ${backupPath}`);
  }

  async validate(): Promise<boolean> {
    try {
      // Validar que todos los elementos tengan IDs únicos
      const ids = this.data.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      if (ids.length !== uniqueIds.size) {
        this.logger.error('IDs duplicados encontrados');
        return false;
      }

      // Validar estructura de datos
      for (const item of this.data) {
        if (!item.id || !item.createdAt || !item.updatedAt) {
          this.logger.error(`Elemento con estructura inválida: ${item.id}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validando datos: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }
}