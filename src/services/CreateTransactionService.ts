// import AppError from '../errors/AppError';

import { getRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
}

class CreateTransactionService {
  public async execute({ title, type, value }: Request): Promise<Transaction> {
    const transactionsRepository = getRepository(TransactionsRepository);

    
  }
}

export default CreateTransactionService;
