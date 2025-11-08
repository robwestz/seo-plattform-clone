import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Keyword } from '../../keywords/entities/keyword.entity';
import { Project } from '../../../database/entities/project.entity';

export enum AlertType {
  POSITION_DROP = 'position_drop',
  POSITION_GAIN = 'position_gain',
  ENTERED_TOP_10 = 'entered_top_10',
  DROPPED_FROM_TOP_10 = 'dropped_from_top_10',
  NOT_RANKING = 'not_ranking',
}

export enum AlertSeverity {
  INFO = 'info',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

/**
 * Rank Alert entity
 * Notifications for significant ranking changes
 */
@Entity('rank_alerts')
@Index(['projectId', 'status'])
@Index(['severity'])
@Index(['createdAt'])
export class RankAlert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'keyword_id', type: 'uuid' })
  keywordId: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'old_position', type: 'integer', nullable: true })
  oldPosition: number;

  @Column({ name: 'new_position', type: 'integer', nullable: true })
  newPosition: number;

  @Column({ name: 'position_change', type: 'integer' })
  positionChange: number;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date;

  @Column({ name: 'acknowledged_by', type: 'uuid', nullable: true })
  acknowledgedBy: string;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => Keyword, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'keyword_id' })
  keyword: Keyword;
}
