#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('Working...');

const createFileFromPath = async (pathToFile: string) => {
  const ext = path.extname(pathToFile);
  console.log('EXT: ', ext);

  return new Promise((resolve) => {
    const chunks: any = [];
    fs.createReadStream(pathToFile, 'utf-8')
      .on('error', (err) => {
        console.error('ERROR: ', err);
      })
      .on('data', (chunk) => {
        chunks.push(chunk);
      })
      .on('end', () => {
        resolve(chunks);
      });
  });
};

// const file = await createFileFromPath('./test-data/dummy1.json');
const file = await createFileFromPath('./test-data/dummy1.csv');
console.log('FILE: ', file);
