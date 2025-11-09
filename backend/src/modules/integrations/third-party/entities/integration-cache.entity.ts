import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('integration_cache')
@Index(['tenantId', 'cacheKey'], { unique: true })
@Index(['expiresAt'])
export class IntegrationCache {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ length: 255 })
  cacheKey: string;

  @Column({ length: 50 })
  provider: string;

  @Column({ type: 'jsonb' })
  data: any;

  @Column({ type: 'timestamptz' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
