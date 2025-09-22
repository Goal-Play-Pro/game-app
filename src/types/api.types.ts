// Tipos específicos para el backend que extienden los tipos base

// Tipos para operaciones de base de datos flexibles
export interface FlexibleEntity {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any;
}

// Interfaces para operaciones de actualización
export interface ChallengeUpdate {
  used?: boolean;
  expiresAt?: Date;
  [key: string]: any;
}

export interface UserUpdate {
  lastLogin?: Date;
  isActive?: boolean;
  metadata?: any;
  [key: string]: any;
}