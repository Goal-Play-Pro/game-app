const dbType = (process.env.DB_TYPE ?? '').toLowerCase();

export const TIMESTAMP_COLUMN_TYPE = (dbType === 'postgres' || dbType === 'postgresql')
  ? 'timestamptz'
  : 'datetime';
