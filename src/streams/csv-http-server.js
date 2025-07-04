import { randomUUID } from 'node:crypto';
import http from 'node:http';
import { Database } from '../database.js';

const database = new Database();

const server = http.createServer(async (req, res) => {
  const { method, url } = req;

  if (method === 'POST' && url === '/tasks') {
    const buffers = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const fullStreamContent = Buffer.concat(buffers).toString();

    const csvParsedValues = parseCsv(fullStreamContent);

    csvParsedValues.forEach((csvValue) => {
      const { title, description } = csvValue;

      database.insert('tasks', {
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    });

    return res.writeHead(201).end();
  }

  return res.writeHead(404).end();
});

function parseCsv(csvStringyfied) {
  const [firstColValue, secondColValue, ...contentValues] = csvStringyfied
    .replaceAll('\n', ',')
    .split(',');

  const titles = contentValues.filter((_, index) => index % 2 === 0);
  const descriptions = contentValues.filter((_, index) => index % 2 === 1);

  return titles.map((value, index) => {
    return {
      [firstColValue]: value,
      [secondColValue]: descriptions[index],
    };
  });
}

server.listen(3334);
