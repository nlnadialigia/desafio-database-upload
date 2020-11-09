import { getCustomRepository } from 'typeorm';
import Transaction from '../models/Transaction';
import fs from 'fs'
import cvsParse from 'csv-parse'
import transactionsRouter from '../routes/transactions.routes';


class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    //CRIAÇÃO DA STREAM DE LEITURA
    const readCSVStream = fs.createReadStream(filePath)

    //DEFINIÇÃO DO QUE SERÁ LIDO
    const parseStream = cvsParse({
      from_line: 2,
      ltrim: true,
      rtrim: true
    })

    //ARMAZENAMENTO DO RESULTADO
    const parseCSV = readCSVStream.pipe(parseStream)

    console.log(parseCSV);


    // LEITURA DO ARQUIVO
    const importTransactions = getCustomRepository(Transaction)

    const transactions:Transaction[] = []

    parseCSV.on('data', line => {
      const [title, type, value, category] = line

      if (!title || !type || !value || !category) {
        return
      }

      transactions.push(line)

    })

    await new Promise(resolve => {
      parseCSV.on('end', resolve)
    })



    return transactions
  }
}

export default ImportTransactionsService;
