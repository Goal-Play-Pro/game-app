import { Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileDataStore } from '../data-store/data-store.interface';
import { BaseEntity } from '../types/base.types';

export class JsonDataStoreService<T extends BaseEntity> implements FileDataStore<T> {
  private readonly logger = new Logger(JsonDataStoreService.name);
  private data: T[] = [];
  private readonly filePath: string;
  private readonly backupDir: string;
  private initialized = false;

  constructor(private readonly fileName: string) {
    this.filePath = join(process.cwd(), 'data', `${fileName}.json`);
    this.backupDir = join(process.cwd(), 'data', 'backups');
    this.initializeDataFile();
  }

  private async initializeDataFile(): Promise<void> {
    if (this.initialized) return;

    try {
      // Crear directorios si no existen
      await fs.mkdir(join(process.cwd(), 'data'), { recursive: true });
      await fs.mkdir(this.backupDir, { recursive: true });

      // Cargar datos existentes o crear archivo vacío
      try {
        const fileContent = await fs.readFile(this.filePath, 'utf-8');
        const parsedData = JSON.parse(fileContent);
        
        // Validar que sea un array
        if (Array.isArray(parsedData)) {
          this.data = parsedData.map(item => ({
            ...item,
            createdAt: new Date(item.createdAt),
            updatedAt: new Date(item.updatedAt)
          }));
        } else {
          this.data = [];
        }
        
        this.logger.log(`Datos cargados desde ${this.fileName}.json: ${this.data.length} registros`);
      } catch (error) {
        this.data = [];
        await this.saveData();
        this.logger.log(`Archivo ${this.fileName}.json creado`);
      }

      this.initialized = true;
    } catch (error) {
      this.logger.error(`Error inicializando datos para ${this.fileName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async saveData(): Promise<void> {
    try {
      await this.initializeDataFile();
      const dataToSave = this.data.map(item => ({
        ...item,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString()
      }));
      
      await fs.writeFile(this.filePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error(`Error guardando datos para ${this.fileName}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findAll(): Promise<T[]> {
    await this.initializeDataFile();
    return [...this.data];
  }

  async findById(id: string): Promise<T | null> {
    await this.initializeDataFile();
    return this.data.find(item => item.id === id) || null;
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    await this.initializeDataFile();
    
    const now = new Date();
    const newItem = {
      ...data,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    } as T;

    this.data.push(newItem);
    await this.saveData();
    
    this.logger.debug(`Creado nuevo elemento en ${this.fileName}: ${newItem.id}`);
    return newItem;
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    await this.initializeDataFile();
    
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`Elemento con ID ${id} no encontrado en ${this.fileName}`);
    }

    const updatedItem = {
      ...this.data[index],
      ...data,
      updatedAt: new Date(),
    };

    this.data[index] = updatedItem;
    await this.saveData();
    
    this.logger.debug(`Actualizado elemento en ${this.fileName}: ${id}`);
    return updatedItem;
  }

  async delete(id: string): Promise<boolean> {
    await this.initializeDataFile();
    
    const index = this.data.findIndex(item => item.id === id);
    if (index === -1) {
      return false;
    }

    this.data.splice(index, 1);
    await this.saveData();
    
    this.logger.debug(`Eliminado elemento de ${this.fileName}: ${id}`);
    return true;
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    await this.initializeDataFile();
    return this.data.filter(predicate);
  }

  async findOne(predicate: (item: T) => boolean): Promise<T | null> {
    await this.initializeDataFile();
    return this.data.find(predicate) || null;
  }

  async upsert(id: string, data: Partial<T>): Promise<T> {
    await this.initializeDataFile();
    
    const existing = await this.findById(id);
    if (existing) {
      return this.update(id, data);
    }
    
    return this.create({ ...data, id } as Omit<T, 'id' | 'createdAt' | 'updatedAt'>);
  }

  async count(): Promise<number> {
    await this.initializeDataFile();
    return this.data.length;
  }

  async exists(id: string): Promise<boolean> {
    await this.initializeDataFile();
    return this.data.some(item => item.id === id);
  }

  async backup(): Promise<void> {
    await this.initializeDataFile();
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = join(this.backupDir, `${this.fileName}-${timestamp}.json`);
    
    await fs.copyFile(this.filePath, backupPath);
    this.logger.log(`Backup creado para ${this.fileName}: ${backupPath}`);
  }

  async restore(backupPath: string): Promise<void> {
    const fileContent = await fs.readFile(backupPath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    
    if (Array.isArray(parsedData)) {
      this.data = parsedData.map(item => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
      }));
    } else {
      this.data = [];
    }
    
    await this.saveData();
    this.logger.log(`Datos restaurados para ${this.fileName} desde: ${backupPath}`);
  }

  async validate(): Promise<boolean> {
    try {
      await this.initializeDataFile();
      
      // Validar que todos los elementos tengan IDs únicos
      const ids = this.data.map(item => item.id);
      const uniqueIds = new Set(ids);
      
      if (ids.length !== uniqueIds.size) {
        this.logger.error(`IDs duplicados encontrados en ${this.fileName}`);
        return false;
      }

      // Validar estructura de datos
      for (const item of this.data) {
        if (!item.id || !item.createdAt || !item.updatedAt) {
          this.logger.error(`Elemento con estructura inválida en ${this.fileName}: ${item.id}`);
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validando datos de ${this.fileName}: ${error instanceof Error ? error.message : String(error)}`);
      return false;
    }
  }

  // Método para limpiar datos corruptos
  async cleanup(): Promise<void> {
    await this.initializeDataFile();
    
    const validData = this.data.filter(item => 
      item.id && 
      item.createdAt && 
      item.updatedAt &&
      typeof item.id === 'string'
    );

    if (validData.length !== this.data.length) {
      this.logger.warn(`Limpiando ${this.data.length - validData.length} registros corruptos de ${this.fileName}`);
      this.data = validData;
      await this.saveData();
    }
  }
}