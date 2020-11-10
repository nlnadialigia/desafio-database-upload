import csvParse from 'csv-parse';
import fs from 'fs';
import { getRepository, In, getCustomRepository } from 'typeorm';
import Category from '../models/Category';
import Transaction from '../models/Transaction';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionsCVS {
  title: string,
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    //CRIAÇÃO DA STREAM DE LEITURA
    const readStream = fs.createReadStream(filePath);

    //DEFINIÇÃO DO QUE SERÁ LIDO
    const parsersStream = csvParse({
      from_line: 2,
      ltrim: true,
    });

    //ARMAZENAMENTO DO RESULTADO
    const pipeStream = readStream.pipe(parsersStream);

    // LEITURA DO ARQUIVO
    const categories: string[] = [];
    const transactions: TransactionsCVS[] = [];

    pipeStream.on('data', async line => {
      const [title, type, value, category] = line;
      if (!title || !type || !value || !category) return;
      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => pipeStream.on('end', resolve));

    // TRATATIVA DAS INFORMAÇÕES DO ARQUIVO
    const categoriesRepository = getRepository(Category);

    // Eliminar categorias repetidas no arquivo
    const setCategories = Array.from(new Set(categories))

    //Veriricar se as categorias existem
    const verifyIfCategoriesExist = await categoriesRepository.find({
      where: { title: In(setCategories) }
    });


    const titleExist = verifyIfCategoriesExist.map(
      (categoryTitle: Category) => categoryTitle.title);
    const addCategoriesTitles = setCategories.filter(
      category => !titleExist.includes(category),
    );
    const newCategories = categoriesRepository.create(
      addCategoriesTitles.map(title => ({
        title,
      })),
    );
    await categoriesRepository.save(newCategories);

    const allCategories = [...verifyIfCategoriesExist, ...newCategories];

    //TRANSACTIONS
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    //CRIAR TRANSAÇÃO
    const createTransactions = transactionsRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );
    await transactionsRepository.save(createTransactions);
    await fs.promises.unlink(filePath);
    return createTransactions;
  }
}

export default ImportTransactionsService;
