import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Role } from '../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async create(data: {
    name: string;
    email: string;
    passwordHash: string;
    role?: Role;
  }): Promise<UserDocument> {
    return this.userModel.create(data);
  }

  // withPassword=true is only ever used by login — passwordHash is
  // excluded by default because of `select: false` on the schema
  async findByEmail(email: string, withPassword = false) {
    const query = this.userModel.findOne({ email: email.toLowerCase() });
    return withPassword ? query.select('+passwordHash') : query;
  }

  async findById(id: string | Types.ObjectId) {
    return this.userModel.findById(id);
  }

  async findAll() {
    return this.userModel.find().sort({ createdAt: -1 });
  }
}
