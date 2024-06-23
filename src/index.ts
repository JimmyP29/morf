#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('Working...');

const getDataFromFile = async (pathToFile: string) => {
  const ext = path.extname(pathToFile);
  console.log('EXT: ', ext);

  if (!ext) throw Error('Please provide a valid file (.json or .csv)');

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

const jsonFile = await getDataFromFile('./test-data/dummy1.json');
const csvFile = await getDataFromFile('./test-data/dummy1.csv');

console.log('JSON FILE: ', jsonFile);
console.log('CSV FILE: ', csvFile);
