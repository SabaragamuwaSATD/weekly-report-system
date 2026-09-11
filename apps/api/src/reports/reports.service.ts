import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';
import { Report, ReportDocument } from './schemas/report.schema';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReportStatus } from '../common/enums/report-status.enum';
import { ReviewAction } from '../common/enums/review-action.enum';
import { Role } from '../common/enums/role.enum';
import type { CurrentUserPayload } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ReportsService {
  constructor(
    @InjectModel(Report.name)
    private readonly reportModel: Model<ReportDocument>,
  ) {}

  // Enforces "flag ONE as the key issue/achievement" from Section 2 —
  // this can't be expressed as a simple field-level validator since it's
  // a rule about the array as a whole, so it lives here in the service.
  private assertAtMostOneKeyFlag(
    entries: { isKey?: boolean }[],
    label: string,
  ) {
    const flagged = entries.filter((e) => e.isKey).length;
    if (flagged > 1) {
      throw new BadRequestException(`Only one ${label} can be flagged as key`);
    }
  }

  private validateContent(content: {
    blockers: { isKey?: boolean }[];
    achievements: { isKey?: boolean }[];
  }) {
    this.assertAtMostOneKeyFlag(content.blockers ?? [], 'blocker');
    this.assertAtMostOneKeyFlag(content.achievements ?? [], 'achievement');
  }

  async create(ownerId: string, dto: CreateReportDto): Promise<ReportDocument> {
    const weekStart = new Date(dto.weekStart);
    const owner = new Types.ObjectId(ownerId);

    const existing = await this.reportModel.findOne({
      owner,
      weekStart,
    });
    if (existing) {
      throw new BadRequestException(
        'A report for this week already exists — edit that one instead',
      );
    }

    return this.reportModel.create({
      owner,
      project: new Types.ObjectId(dto.project),
      weekStart,
      weekEnd: new Date(dto.weekEnd),
      status: ReportStatus.DRAFT,
      currentVersion: 1,
      content: {
        tasksCompleted: [],
        tasksPlannedNextWeek: [],
        blockers: [],
        achievements: [],
        hoursByType: {},
      },
      versions: [],
      reviews: [],
    });
  }

  async findById(id: string) {
    const report = await this.reportModel
      .findById(id)
      .populate('project', 'name')
      .populate('owner', 'name email')
      .populate('reviews.reviewedBy', 'name email');

    if (!report) {
      throw new NotFoundException('Report not found');
    }
    return report;
  }

  private assertCanView(report: ReportDocument, user: CurrentUserPayload) {
    const owner = report.owner as unknown as { _id?: Types.ObjectId };
    const isOwner = owner._id?.toString?.() ?? report.owner.toString();
    if (isOwner !== user.userId && user.role !== Role.MANAGER) {
      throw new ForbiddenException('You do not have access to this report');
    }
  }

  private assertIsOwner(report: ReportDocument, userId: string) {
    const owner = report.owner as unknown as { _id?: Types.ObjectId };
    const ownerId = owner._id?.toString?.() ?? report.owner.toString();
    if (ownerId !== userId) {
      throw new ForbiddenException('You can only modify your own reports');
    }
  }

  private assertEditable(report: ReportDocument) {
    if (
      report.status !== ReportStatus.DRAFT &&
      report.status !== ReportStatus.NEEDS_CORRECTION
    ) {
      throw new BadRequestException(
        'A report can only be edited while it is a Draft or Needs Correction',
      );
    }
  }

  async getOne(id: string, user: CurrentUserPayload) {
    const report = await this.findById(id);
    this.assertCanView(report, user);
    return report;
  }

  async update(id: string, userId: string, dto: UpdateReportDto) {
    const report = await this.findById(id);
    this.assertIsOwner(report, userId);
    this.assertEditable(report);

    this.validateContent(dto.content);

    if (dto.project) {
      report.project = new Types.ObjectId(dto.project);
    }

    report.content = {
      tasksCompleted: dto.content.tasksCompleted,
      tasksPlannedNextWeek: dto.content.tasksPlannedNextWeek,
      blockers: dto.content.blockers,
      achievements: dto.content.achievements,
      hoursByType: dto.content.hoursByType
        ? new Map(Object.entries(dto.content.hoursByType))
        : new Map<string, number>(),
      notes: dto.content.notes,
    } as Report['content'];

    return report.save();
  }

  async submit(id: string, userId: string) {
    const report = await this.findById(id);
    this.assertIsOwner(report, userId);
    this.assertEditable(report);
    this.validateContent(report.content);

    const hasAnyTasks =
      (report.content.tasksCompleted?.length ?? 0) > 0 ||
      (report.content.tasksPlannedNextWeek?.length ?? 0) > 0;

    if (!hasAnyTasks) {
      throw new BadRequestException('Add at least one task before submitting');
    }

    // Freeze the current draft into a new version, then advance the pointer.
    // The old versions[] entries are never touched — that's the whole
    // point of the version-history requirement from Section 3.
    report.versions.push({
      versionNumber: report.currentVersion,
      content: report.content,
      submittedAt: new Date(),
    });

    report.status = ReportStatus.SUBMITTED;
    report.currentVersion += 1;

    return report.save();
  }

  async review(id: string, managerId: string, dto: ReviewReportDto) {
    const report = await this.findById(id);

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new BadRequestException(
        'Only a report with status Submitted can be reviewed',
      );
    }

    // The version being reviewed is always the most recent one pushed by submit() —
    // currentVersion was already advanced past it, so we subtract 1.
    const reviewedVersion = report.currentVersion - 1;

    report.reviews.push({
      versionNumber: reviewedVersion,
      action: dto.action,
      comment: dto.comment,
      reviewedBy: new Types.ObjectId(managerId),
      reviewedAt: new Date(),
    });

    report.status =
      dto.action === ReviewAction.APPROVED
        ? ReportStatus.APPROVED
        : ReportStatus.NEEDS_CORRECTION;

    return report.save();
  }

  async getVersionHistory(id: string, user: CurrentUserPayload) {
    const report = await this.findById(id);
    this.assertCanView(report, user);

    return {
      currentStatus: report.status,
      currentVersion: report.currentVersion,
      versions: report.versions,
      reviews: report.reviews,
    };
  }

  async findAll(user: CurrentUserPayload, query: QueryReportsDto) {
    const filter: QueryFilter<ReportDocument> = {};

    // A team member can NEVER see another team member's reports, regardless
    // of what `owner` they pass in the query string — this is enforced here,
    // not left to trust on the client.
    if (user.role !== Role.MANAGER) {
      filter.owner = new Types.ObjectId(user.userId);
    } else if (query.owner) {
      filter.owner = new Types.ObjectId(query.owner);
    }

    if (query.project) filter.project = new Types.ObjectId(query.project);
    if (query.status) filter.status = query.status;

    if (query.weekStart || query.weekEnd) {
      const weekStartFilter: { $gte?: Date; $lte?: Date } = {};
      if (query.weekStart) weekStartFilter.$gte = new Date(query.weekStart);
      if (query.weekEnd) weekStartFilter.$lte = new Date(query.weekEnd);
      filter.weekStart = weekStartFilter;
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [data, total] = await Promise.all([
      this.reportModel
        .find(filter)
        .populate('project', 'name')
        .populate('owner', 'name email')
        .sort({ weekStart: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      this.reportModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
