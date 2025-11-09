import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('oauth_health_checks')
@Index(['connectionId', 'checkedAt'])
export class OAuthHealthCheck {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index()
  connectionId: string;

  @Column({ type: 'boolean' })
  isHealthy: boolean;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'timestamptz' })
  checkedAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
