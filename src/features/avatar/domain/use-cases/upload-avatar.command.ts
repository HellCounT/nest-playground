import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../../../user/repository/user.repository.js';
import {
  AvatarsMaximumAmountAchievedException,
  UserNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { AvatarRepository } from '../../repository/avatar.repository.js';
import {
  AVATARS_FOLDER_NAME,
  MAX_AVATARS,
} from '../../constraints/avatars.constraints.js';
import { IFileService } from '../../../../providers/files/files.adapter.js';
import { v4 as uuidv4 } from 'uuid';
import { Avatar } from '../../entity/avatar.entity.js';

export class UploadAvatarCommand extends Command<Avatar> {
  constructor(
    public readonly userId: string,
    public readonly file: Express.Multer.File,
  ) {
    super();
  }
}

@CommandHandler(UploadAvatarCommand)
@Injectable()
export class UploadAvatarHandler implements ICommandHandler<UploadAvatarCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly avatarRepository: AvatarRepository,
    private readonly fileService: IFileService,
  ) {}
  async execute(command: UploadAvatarCommand): Promise<Avatar> {
    const { userId, file } = command;
    const user = await this.userRepository.getById(userId);
    if (!user) throw new UserNotFoundException();
    const foundAvatars = await this.avatarRepository.getUserAvatars(user.id);
    if (foundAvatars[1] >= MAX_AVATARS)
      throw new AvatarsMaximumAmountAchievedException();

    const newAvatarId = uuidv4();
    await this.fileService.uploadFile({
      file,
      folder: AVATARS_FOLDER_NAME,
      name: newAvatarId,
    });
    return await this.avatarRepository.create({
      id: newAvatarId,
      fileName: file.originalname,
      userId: userId,
    });
  }
}

/*
Теперь у пользователя появляется новая связанная сущность — avatars. Активных аватарок может быть до 5.
При этом аватарку можно удалить и она становится не активной (нужно выполнять soft delete).
После удаления, количество активных аватарок становится меньше — это значит, что появляется возможность загружать новые аватарки для пользователя
Аватар может загружать сам пользователь себе (после авторизации).
Не должно быть возможность загрузить аватар чужому профилю. В таблицу обязательно добавь поле, когда была добавлена аватарка
*/
