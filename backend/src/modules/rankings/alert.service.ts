import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  RankAlert,
  AlertType,
  AlertSeverity,
  AlertStatus,
} from './entities/rank-alert.entity';
import { Ranking } from './entities/ranking.entity';
import { Keyword } from '../keywords/entities/keyword.entity';

/**
 * Alert Service
 * Manages ranking change alerts and notifications
 */
@Injectable()
export class AlertService {
  private readonly logger = new Logger(AlertService.name);

  constructor(
    @InjectRepository(RankAlert)
    private alertRepository: Repository<RankAlert>,
    @InjectRepository(Ranking)
    private rankingRepository: Repository<Ranking>,
    @InjectRepository(Keyword)
    private keywordRepository: Repository<Keyword>,
  ) {}

  /**
   * Check for ranking changes and create alerts
   * @param ranking - New ranking data
   * @returns Created alerts
   */
  async checkAndCreateAlerts(ranking: Ranking): Promise<RankAlert[]> {
    this.logger.log(`Checking for alerts for ranking: ${ranking.id}`);

    const alerts: RankAlert[] = [];

    if (!ranking.previousPosition) {
      return alerts; // No previous data to compare
    }

    const keyword = await this.keywordRepository.findOne({
      where: { id: ranking.keywordId },
    });

    if (!keyword) {
      return alerts;
    }

    // Check for significant position drop
    if (ranking.positionChange < -5) {
      alerts.push(
        await this.createAlert({
          projectId: ranking.projectId,
          keywordId: ranking.keywordId,
          type: AlertType.POSITION_DROP,
          severity: ranking.positionChange < -10 ? AlertSeverity.CRITICAL : AlertSeverity.WARNING,
          message: `"${keyword.keyword}" dropped ${Math.abs(ranking.positionChange)} positions (${ranking.previousPosition} → ${ranking.position})`,
          oldPosition: ranking.previousPosition,
          newPosition: ranking.position,
          positionChange: ranking.positionChange,
        }),
      );
    }

    // Check for significant position gain
    if (ranking.positionChange > 5) {
      alerts.push(
        await this.createAlert({
          projectId: ranking.projectId,
          keywordId: ranking.keywordId,
          type: AlertType.POSITION_GAIN,
          severity: AlertSeverity.INFO,
          message: `"${keyword.keyword}" gained ${ranking.positionChange} positions (${ranking.previousPosition} → ${ranking.position})`,
          oldPosition: ranking.previousPosition,
          newPosition: ranking.position,
          positionChange: ranking.positionChange,
        }),
      );
    }

    // Check for entering top 10
    if (ranking.previousPosition > 10 && ranking.position <= 10) {
      alerts.push(
        await this.createAlert({
          projectId: ranking.projectId,
          keywordId: ranking.keywordId,
          type: AlertType.ENTERED_TOP_10,
          severity: AlertSeverity.INFO,
          message: `"${keyword.keyword}" entered top 10 (position ${ranking.position})`,
          oldPosition: ranking.previousPosition,
          newPosition: ranking.position,
          positionChange: ranking.positionChange,
        }),
      );
    }

    // Check for dropping from top 10
    if (ranking.previousPosition <= 10 && ranking.position > 10) {
      alerts.push(
        await this.createAlert({
          projectId: ranking.projectId,
          keywordId: ranking.keywordId,
          type: AlertType.DROPPED_FROM_TOP_10,
          severity: AlertSeverity.WARNING,
          message: `"${keyword.keyword}" dropped from top 10 (position ${ranking.position})`,
          oldPosition: ranking.previousPosition,
          newPosition: ranking.position,
          positionChange: ranking.positionChange,
        }),
      );
    }

    // Check for not ranking (>100)
    if (ranking.position > 100 && ranking.previousPosition <= 100) {
      alerts.push(
        await this.createAlert({
          projectId: ranking.projectId,
          keywordId: ranking.keywordId,
          type: AlertType.NOT_RANKING,
          severity: AlertSeverity.CRITICAL,
          message: `"${keyword.keyword}" is no longer ranking in top 100`,
          oldPosition: ranking.previousPosition,
          newPosition: ranking.position,
          positionChange: ranking.positionChange,
        }),
      );
    }

    return alerts;
  }

  /**
   * Get all alerts for a project
   * @param projectId - Project ID
   * @param status - Filter by status
   * @returns List of alerts
   */
  async getProjectAlerts(projectId: string, status?: AlertStatus): Promise<RankAlert[]> {
    this.logger.log(`Getting alerts for project: ${projectId}`);

    const where: any = { projectId };
    if (status) {
      where.status = status;
    }

    return this.alertRepository.find({
      where,
      relations: ['keyword'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get alerts for a keyword
   * @param keywordId - Keyword ID
   * @returns List of alerts
   */
  async getKeywordAlerts(keywordId: string): Promise<RankAlert[]> {
    this.logger.log(`Getting alerts for keyword: ${keywordId}`);

    return this.alertRepository.find({
      where: { keywordId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Acknowledge an alert
   * @param alertId - Alert ID
   * @param userId - User ID who acknowledged
   * @returns Updated alert
   */
  async acknowledgeAlert(alertId: string, userId: string): Promise<RankAlert> {
    this.logger.log(`Acknowledging alert: ${alertId}`);

    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.ACKNOWLEDGED;
    alert.acknowledgedAt = new Date();
    alert.acknowledgedBy = userId;

    return this.alertRepository.save(alert);
  }

  /**
   * Resolve an alert
   * @param alertId - Alert ID
   * @returns Updated alert
   */
  async resolveAlert(alertId: string): Promise<RankAlert> {
    this.logger.log(`Resolving alert: ${alertId}`);

    const alert = await this.alertRepository.findOne({ where: { id: alertId } });

    if (!alert) {
      throw new Error('Alert not found');
    }

    alert.status = AlertStatus.RESOLVED;
    alert.resolvedAt = new Date();

    return this.alertRepository.save(alert);
  }

  /**
   * Get alert statistics
   * @param projectId - Project ID
   * @returns Alert statistics
   */
  async getAlertStatistics(projectId: string) {
    this.logger.log(`Getting alert statistics for project: ${projectId}`);

    const alerts = await this.alertRepository.find({ where: { projectId } });

    return {
      total: alerts.length,
      active: alerts.filter((a) => a.status === AlertStatus.ACTIVE).length,
      acknowledged: alerts.filter((a) => a.status === AlertStatus.ACKNOWLEDGED).length,
      resolved: alerts.filter((a) => a.status === AlertStatus.RESOLVED).length,
      bySeverity: {
        info: alerts.filter((a) => a.severity === AlertSeverity.INFO).length,
        warning: alerts.filter((a) => a.severity === AlertSeverity.WARNING).length,
        critical: alerts.filter((a) => a.severity === AlertSeverity.CRITICAL).length,
      },
      byType: {
        positionDrop: alerts.filter((a) => a.type === AlertType.POSITION_DROP).length,
        positionGain: alerts.filter((a) => a.type === AlertType.POSITION_GAIN).length,
        enteredTop10: alerts.filter((a) => a.type === AlertType.ENTERED_TOP_10).length,
        droppedFromTop10: alerts.filter((a) => a.type === AlertType.DROPPED_FROM_TOP_10).length,
        notRanking: alerts.filter((a) => a.type === AlertType.NOT_RANKING).length,
      },
    };
  }

  /**
   * Create a new alert
   */
  private async createAlert(data: {
    projectId: string;
    keywordId: string;
    type: AlertType;
    severity: AlertSeverity;
    message: string;
    oldPosition: number;
    newPosition: number;
    positionChange: number;
  }): Promise<RankAlert> {
    const alert = this.alertRepository.create(data);
    return this.alertRepository.save(alert);
  }
}
