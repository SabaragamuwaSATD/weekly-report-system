import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './schemas/project.schema';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async create(dto: CreateProjectDto, createdBy: string) {
    const existing = await this.projectModel.findOne({ name: dto.name });
    if (existing) {
      throw new ConflictException('A project with this name already exists');
    }

    return this.projectModel.create({ ...dto, createdBy });
  }

  // Team members only ever need the active list (for the report form's dropdown).
  // Managers get everything, including soft-deleted ones, on the management page.
  async findAll(includeInactive = false) {
    const filter = includeInactive ? {} : { isActive: true };
    return this.projectModel.find(filter).sort({ name: 1 });
  }

  async findById(id: string) {
    const project = await this.projectModel.findById(id);
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findById(id);

    if (dto.name && dto.name !== project.name) {
      const clash = await this.projectModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });
      if (clash) {
        throw new ConflictException('A project with this name already exists');
      }
    }

    Object.assign(project, dto);
    return project.save();
  }

  // Soft-delete, per the Step 2 design decision: reports referencing this
  // project must keep working after a manager "deletes" it.
  async softDelete(id: string) {
    const project = await this.findById(id);
    project.isActive = false;
    return project.save();
  }

  async reactivate(id: string) {
    const project = await this.findById(id);
    project.isActive = true;
    return project.save();
  }
}
