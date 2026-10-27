import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../repository/user.repository.js';
import { PinoLogger } from 'nestjs-pino';
import {
  IdempotencyKeyConflictException,
  InsufficientFundsException,
  InvalidIdempotencyKeyException,
  InvalidMoneyTransferAmountException,
  MoneyCreditFailedException,
  SenderAndRecipientIdsConflictException,
  SenderOrRecipientNotFoundException,
} from '../../../../common/exceptions/domain-exceptions.js';
import { MoneyMathsUtil } from '../../../../common/utils/money-maths.util.js';
import { Inject } from '@nestjs/common';
import {
  type ITransactionManager,
  TRANSACTION_MANAGER,
} from '../../../../application/transaction-manager.interface.js';
import { isUUID } from 'class-validator';
import { MoneyTransferRepository } from '../../../money-transfer/repository/money-transfer.repository.js';

export class TransferMoneyCommand extends Command<void> {
  constructor(
    public readonly senderId: string,
    public readonly recipientId: string,
    public readonly amount: string,
    public readonly idempotencyKey: string,
  ) {
    super();
  }
}

@CommandHandler(TransferMoneyCommand)
export class TransferMoneyHandler implements ICommandHandler<TransferMoneyCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly moneyTransferRepository: MoneyTransferRepository,
    private readonly moneyMaths: MoneyMathsUtil,
    private readonly logger: PinoLogger,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(command: TransferMoneyCommand) {
    const { senderId, recipientId, amount, idempotencyKey } = command;

    this.logger.debug({ amount }, 'Money transfer initiated');

    if (!isUUID(idempotencyKey, '4')) {
      this.logger.warn(
        { idempotencyKey },
        'Money transfer failed: invalid idempotency key',
      );
      throw new InvalidIdempotencyKeyException();
    }

    if (
      !this.moneyMaths.isValidAmount(amount) ||
      !this.moneyMaths.hasLessOrTwoDecimals(amount)
    ) {
      this.logger.warn(
        { amount },
        'Money transfer failed: amount must be positive and have 2 decimals',
      );
      throw new InvalidMoneyTransferAmountException();
    }

    const normalizedAmount = this.moneyMaths.normalizeAmount(amount);

    if (senderId === recipientId) {
      this.logger.warn('Sender id matches with recipient id');
      throw new SenderAndRecipientIdsConflictException();
    }

    await this.transactionManager.run(async () => {
      const registered = await this.moneyTransferRepository.tryRegister({
        senderId,
        recipientId,
        amount: normalizedAmount,
        idempotencyKey,
      });

      if (!registered) {
        const existingTransfer =
          await this.moneyTransferRepository.findBySenderAndIdempotencyKey(
            senderId,
            idempotencyKey,
          );

        if (!existingTransfer) {
          this.logger.error(
            { idempotencyKey },
            'Money transfer failed: idempotency record not found',
          );
          throw new Error('Idempotency record not found');
        }

        if (
          existingTransfer.amount !== normalizedAmount ||
          existingTransfer.recipientId !== recipientId
        ) {
          this.logger.warn(
            { idempotencyKey },
            'Money transfer failed: idempotency key conflict',
          );
          throw new IdempotencyKeyConflictException();
        }

        return;
      }

      const sender = await this.userRepository.getById(senderId);
      const recipient = await this.userRepository.getById(recipientId);

      if (!recipient || !sender) {
        this.logger.warn(
          { amount },
          'Money transfer failed: sender or recipient not found',
        );
        throw new SenderOrRecipientNotFoundException();
      }

      const debitResult = await this.userRepository.debitIfSufficient(
        senderId,
        normalizedAmount,
      );
      if (!debitResult) throw new InsufficientFundsException();

      const creditResult = await this.userRepository.credit(
        recipientId,
        normalizedAmount,
      );
      if (!creditResult) throw new MoneyCreditFailedException();
    });
  }
}
