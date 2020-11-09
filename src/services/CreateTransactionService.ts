// import AppError from '../errors/AppError';

import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string
}

class CreateTransactionService {
  public async execute({ title, type, value, category }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoriesRepository = getRepository(Category)

    let transactionCategory = await categoriesRepository.findOne({
      where: { title: category }
    })

    if (!transactionCategory) {
      transactionCategory = categoriesRepository.create({
        title: category
      })
    }

    await categoriesRepository.save(transactionCategory)

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category: transactionCategory
    });

    const balance = await transactionsRepository.getBalance()

    if (transaction.type == 'outcome' && balance.total < transaction.value) {
      throw new AppError("You don't have balance for this transaction", 400);
    }

    await transactionsRepository.save(transaction);



    return (transaction);
  }
}

export default CreateTransactionService;
