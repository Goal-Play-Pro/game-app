import { Injectable, Logger } from '@nestjs/common';
import { DataSource, Repository, EntityTarget } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class DataAdapterService {
  private readonly logger = new Logger(DataAdapterService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {
    this.logger.log('📊 Data adapter initialized with TypeORM');
  }

  private getRepository<T>(entityClass: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entityClass);
  }

  // Helper to serialize/deserialize JSON for SQLite compatibility
  private serializeJson(data: any): string {
    if (data === null || data === undefined) return null;
    if (typeof data === 'string') return data;
    return JSON.stringify(data);
  }

  private deserializeJson(data: string): any {
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return data; // Return as string if not valid JSON
    }
  }

  async findAll<T>(entityClass: EntityTarget<T>): Promise<T[]> {
    const repository = this.getRepository(entityClass);
    const results = await repository.find();
    return this.processJsonFields(results);
  }

  async findById<T>(entityClass: EntityTarget<T>, id: string): Promise<T | null> {
    const repository = this.getRepository(entityClass);
    const result = await repository.findOne({ where: { id } as any });
    return result ? this.processJsonFields([result])[0] : null;
  }

  async findOne<T>(entityClass: EntityTarget<T>, where: any): Promise<T | null> {
    const repository = this.getRepository(entityClass);
    const result = await repository.findOne({ where });
    return result ? this.processJsonFields([result])[0] : null;
  }

  async findWhere<T>(entityClass: EntityTarget<T>, where: any): Promise<T[]> {
    const repository = this.getRepository(entityClass);
    const results = await repository.find({ where });
    return this.processJsonFields(results);
  }

  async create<T>(entityClass: EntityTarget<T>, data: any): Promise<T> {
    const repository = this.getRepository(entityClass);
    const processedData = this.prepareJsonFields(data);
    const entity = repository.create(processedData);
    const saved = await repository.save(entity);
    return this.processJsonFields([saved as T])[0] as T;
  }

  async update<T>(entityClass: EntityTarget<T>, id: string, data: any): Promise<T> {
    const repository = this.getRepository(entityClass);
    const processedData = this.prepareJsonFields(data);
    await repository.update(id, processedData);
    
    const updated = await repository.findOne({ where: { id } as any });
    if (!updated) {
      throw new Error(`Entity ${id} not found after update`);
    }
    return this.processJsonFields([updated as T])[0] as T;
  }

  async delete<T>(entityClass: EntityTarget<T>, id: string): Promise<boolean> {
    const repository = this.getRepository(entityClass);
    const result = await repository.delete(id);
    return result.affected > 0;
  }

  async count<T>(entityClass: EntityTarget<T>, where?: any): Promise<number> {
    const repository = this.getRepository(entityClass);
    return repository.count({ where });
  }

  async exists<T>(entityClass: EntityTarget<T>, where: any): Promise<boolean> {
    const repository = this.getRepository(entityClass);
    const count = await repository.count({ where });
    return count > 0;
  }

  // Process JSON fields for SQLite compatibility
  private processJsonFields<T>(entities: T[]): T[] {
    return entities.map(entity => {
      const processed = { ...entity };
      
      // Handle common JSON fields
      if (processed['metadata']) {
        processed['metadata'] = this.deserializeJson(processed['metadata']);
      }
      if (processed['baseStats']) {
        processed['baseStats'] = this.deserializeJson(processed['baseStats']);
      }
      if (processed['response']) {
        processed['response'] = this.deserializeJson(processed['response']);
      }
      
      return processed;
    });
  }

  private prepareJsonFields(data: any): any {
    const processed = { ...data };
    
    // Handle common JSON fields
    if (processed.metadata) {
      processed.metadata = this.serializeJson(processed.metadata);
    }
    if (processed.baseStats) {
      processed.baseStats = this.serializeJson(processed.baseStats);
    }
    if (processed.response) {
      processed.response = this.serializeJson(processed.response);
    }
    
    return processed;
  }
}