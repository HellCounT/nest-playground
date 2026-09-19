import * as bcrypt from 'bcrypt';
import { AppConfigService } from '../../config/app-config.service.js';
import { Injectable } from '@nestjs/common';
import { PasswordHashGenerationFailedException } from '../exceptions/domain-exceptions.js';

@Injectable()
export class HashPasswordUtil {
  constructor(protected configService: AppConfigService) {}

  async generateHash(password: string) {
    try {
      const salt = await bcrypt.genSalt(this.configService.saltRounds);
      return bcrypt.hash(password, salt);
    } catch (e) {
      throw new PasswordHashGenerationFailedException(e);
    }
  }

  async verifyPassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  }
}
