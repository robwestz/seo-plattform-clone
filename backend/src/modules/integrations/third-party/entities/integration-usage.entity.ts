import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('integration_usage')
@Index(['tenantId', 'createdAt'])
@Index(['provider', 'operation'])
export class IntegrationUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  tenantId: string;

  @Column({ length: 50 })
  provider: string;

  @Column({ length: 100 })
  operation: string;

  @Column({ type: 'int', default: 1 })
  requestCount: number;

  @Column({ type: 'int', default: 0 })
  recordsReturned: number;

  @Column({ type: 'decimal', precision: 10, scale: 4, default: 0 })
  cost: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;
}
