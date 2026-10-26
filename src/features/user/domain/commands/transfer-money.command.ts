import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../repository/user.repository.js';
import { PinoLogger } from 'nestjs-pino';
import {
  InsufficientFundsException,
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

export class TransferMoneyCommand extends Command<void> {
  constructor(
    public readonly senderId: string,
    public readonly recipientId: string,
    public readonly amount: string,
  ) {
    super();
  }
}

@CommandHandler(TransferMoneyCommand)
export class TransferMoneyHandler implements ICommandHandler<TransferMoneyCommand> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly moneyMaths: MoneyMathsUtil,
    private readonly logger: PinoLogger,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: ITransactionManager,
  ) {}

  async execute(command: TransferMoneyCommand) {
    const { senderId, recipientId, amount } = command;

    this.logger.debug({ amount }, 'Money transfer initiated');

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

    if (senderId === recipientId) {
      this.logger.warn('Sender id matches with recipient id');
      throw new SenderAndRecipientIdsConflictException();
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

    await this.transactionManager.run(async () => {
      const debitResult = await this.userRepository.debitIfSufficient(
        senderId,
        amount,
      );
      if (!debitResult) throw new InsufficientFundsException();

      const creditResult = await this.userRepository.credit(
        recipientId,
        amount,
      );
      if (!creditResult) throw new MoneyCreditFailedException();
    });
  }
}
