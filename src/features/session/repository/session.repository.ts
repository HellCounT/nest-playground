import { Injectable } from '@nestjs/common';
import { IBaseRepository } from '../../../base/base-repository.interface.js';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Session } from '../entity/session.entity.js';
import { SessionCreateType } from '../types/session-create.type.js';
import { SessionUpdateType } from '../types/session-update.type.js';

@Injectable()
export class SessionRepository implements IBaseRepository<
  Session,
  SessionUpdateType,
  SessionCreateType
> {
  constructor(
    @InjectRepository(Session)
    protected sessionsRepository: Repository<Session>,
  ) {}
  async create(data: SessionCreateType): Promise<Session | null> {
    try {
      const session = this.sessionsRepository.create(data);
      return await this.sessionsRepository.save(session);
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async getById(id: string): Promise<Session | null> {
    try {
      return await this.sessionsRepository.findOneBy({
        id: id,
        deletedAt: IsNull(),
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async getBySessionDetails(
    userId: string,
    ip: string,
    deviceName: string,
  ): Promise<Session | null> {
    try {
      return await this.sessionsRepository.findOneBy({
        userId: userId,
        ip: ip,
        deviceName: deviceName,
        deletedAt: IsNull(),
      });
    } catch (e) {
      console.log(e);
      return null;
    }
  }

  async updateOneById(id: string, data: SessionUpdateType): Promise<boolean> {
    try {
      const updateResult = await this.sessionsRepository.update(id, {
        refreshTokenCreationDate: data.refreshTokenCreationDate,
      });
      return !!updateResult.affected;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  async deleteOneById(id: string): Promise<boolean> {
    try {
      const deleteResult = await this.sessionsRepository.softDelete(id);
      return !!deleteResult.affected;
    } catch (e) {
      console.log(e);
      return false;
    }
  }

  public async testingDeleteAllRecords(): Promise<boolean> {
    try {
      const deleteResult = await this.sessionsRepository.deleteAll();
      return !!deleteResult.affected;
    } catch (e) {
      console.log(e);
      return false;
    }
  }
}
