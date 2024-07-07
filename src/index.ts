#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import util from 'util';
import stream from 'stream';
import { stringify } from 'querystring';

const finished = util.promisify(stream.finished);

// ANSI escape codes for text color
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

console.log(`${CYAN}%s${RESET}`, 'Starting...');

enum FileType {
  JSON = '.json',
  CSV = '.csv',
}

const getDataFromOriginFile = async (
  pathToFile: string,
): Promise<Array<{ chunk: any; type: FileType }>> => {
  const ext = path.extname(pathToFile);

  if (!ext)
    throw Error(`${RED}Please provide a valid file (.json or .csv)${RESET}`);

  return new Promise((resolve) => {
    const chunks: any = [];
    fs.createReadStream(pathToFile, 'utf-8')
      .on('error', (err) => {
        console.error(`${RED}%s${RESET}`, err);
      })
      .on('data', (chunk) => {
        chunks.push({ chunk: chunk, type: ext });
      })
      .on('end', () => {
        resolve(chunks);
      });
  });
};

const createFileAtDestination = async (
  file: { chunk: any; type: FileType }[],
  fileName: string,
  destination: string,
): Promise<void> => {
  if (!file || file.length === 0) throw Error(`${RED}No file found${RESET}`);

  try {
    if (!fs.existsSync(destination)) {
      fs.mkdirSync(destination);

      const folder = path.basename(destination);
      const parentFolder = path.dirname(destination);
      console.log(
        `${GREEN}%s${RESET}`,
        `New folder - '${folder}' created at ${parentFolder}`,
      );
    }
  } catch (error) {
    console.error(`${RED}%s${RESET}`, error);
  }
  const now = new Date().toISOString();
  const finalFileName = `${fileName}-${now}`;
  const { chunk, type } = file[0];

  const writable = fs.createWriteStream(
    `${destination}/${finalFileName}${type}`,
    {
      encoding: 'utf-8',
    },
  );

  writable.write(chunk);
  writable.end();

  await finished(writable);

  console.log(
    `${GREEN}%s${RESET}`,
    `File (${finalFileName}${type}) created at ${destination}`,
  );
};

const fromJSONToCSV = (formerData: any): string => {
  let csv;
  try {
    csv = formerData.map((row: any) => Object.values(row));

    csv.unshift(Object.keys(formerData[0]));
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }
  return csv.join('\n');
};

const fromCSVToJSON = (formerData: any[]): string => {
  const formattedData = [];
  const [head, ...body] = formerData;

  const headArray = head.split(',');
  const bodyArray = body.map((element) => element.split(','));

  try {
    const reduceData = (headArr: any[], bodyArr: any[]) =>
      headArr.reduce((prev: any, cur: any, index: number) => {
        return { ...prev, [cur]: bodyArr[index] };
      }, {});

    for (let i = 0; i < bodyArray.length; i++) {
      formattedData.push(reduceData(headArray, bodyArray[i]));
    }

    console.table(formattedData);
  } catch (error) {
    console.error(`${RED}${error}${RESET}`);
  }

  return JSON.stringify(formattedData);
};

const convertFile = async (
  from: string,
  convertTo: FileType,
  destination: string,
): Promise<void> => {
  const fileData: { chunk: any; type: FileType }[] =
    await getDataFromOriginFile(from);

  if (!fileData || fileData.length === 0)
    throw Error(`${RED}No file data found${RESET}`);

  const ext = `.${path.basename(from).split('.')[1]}`;

  if (ext === convertTo.toString())
    throw Error(
      `${RED}Origin file type of ${ext} cannot be the same as the intended conversion type ${convertTo} - Use createFileAtDestination() instead.${RESET}`,
    );

  console.log(`${CYAN}%s${RESET}`, 'Morphing...');

  let convertedFileData = '';

  if (fileData[0].type === FileType.JSON) {
    const formerData = JSON.parse(fileData[0].chunk);

    convertedFileData = fromJSONToCSV([formerData]);
  } else if (fileData[0].type === FileType.CSV) {
    const formerData = fileData[0].chunk.toString().split('\n');

    convertedFileData = fromCSVToJSON(formerData);
  }

  const fileName = path.basename(from).split('.')[0];

  createFileAtDestination(
    [{ chunk: convertedFileData, type: convertTo }],
    fileName,
    destination,
  );
};

const standardiseJSONValues = async (
  from: string,
  value: string | number | boolean,
) => {
  const file = await getDataFromOriginFile(from);
  // const fileName = path.basename(fromPath).split('.')[0];
  console.log(JSON.stringify(file[0].chunk));
  const jsonChunk = JSON.parse(file[0].chunk);
  const copy = jsonChunk;
  console.log('COPY: ', copy);
  // Instead of relying on the first key being called 'data' this needs to be abstracted out and referenced below.
  const zeroedValues = copy.data.map((entry: any) => {
    let zeroedEntry = {};
    Object.keys(entry).forEach((key) => {
      zeroedEntry = { ...zeroedEntry, [key]: value };
    });

    return zeroedEntry;
  });

  return zeroedValues;
};

const isDeepEqual = (object1: any, object2: any) => {
  console.log('OBJ 1: ', object1);
  console.log('OBJ 2: ', object2);
  const objKeys1 = Object.keys(object1);
  const objKeys2 = Object.keys(object2);

  if (objKeys1.length !== objKeys2.length) return false;

  for (var key of objKeys1) {
    const value1 = object1[key];
    const value2 = object2[key];

    const isObjects = isObject(value1) && isObject(value2);

    if (
      (isObjects && !isDeepEqual(value1, value2)) ||
      (!isObjects && value1 !== value2)
    ) {
      return false;
    }
  }
  return true;
};

const isObject = (object: any) => {
  return object != null && typeof object === 'object';
};

const glueJSON = (objects: object[]): any => {
  //This doesn't work fully - it needs to take into account objects and arrays, not just arrays
  return { ...objects.map((o) => o) };
};

const aggregateJSONToCSV = async (
  from: string[],
  destination: string,
): Promise<void> => {
  if (from.length === 0)
    throw Error(
      `${RED}Please provide at least one origin path within 'from'.${RESET}`,
    );

  const originJSON: any[] = [];
  const comparison: any[] = [];

  from.forEach(async (fromPath) => {
    const json = await getDataFromOriginFile(fromPath);
    if (!json) throw Error(`${RED}Unable to use JSON file (${json}).${RESET}`);

    originJSON.push(JSON.parse(json[0].chunk));
  });

  if (from.length > 1) {
    Promise.all(
      from.map((fromPath) => {
        return standardiseJSONValues(fromPath, '');
      }),
    ).then(async (standardisedJSON) => {
      comparison.push(standardisedJSON);

      if (!comparison || !comparison[0]) {
        throw Error(`${RED}No files to compare${RESET}`);
      }

      console.log('COMPARISON: ', comparison);
      console.log(`${CYAN}%s${RESET}`, 'Starting Recursion...');
      if (isDeepEqual(comparison[0][0], comparison[0][1])) {
        console.log(
          `${GREEN}%s${RESET}`,
          `All JSON file structures match - Good Job!`,
        );
        console.log('ORIGIN JSON: ', originJSON);
        const glued = glueJSON([...originJSON[0].data, ...originJSON[1].data]);

        console.log('GLUED: ', glued);
        await createFileAtDestination(
          [{ chunk: JSON.stringify(glued), type: FileType.CSV }],
          'test-aggregated-csv',
          destination,
        );
      } else {
        console.error(
          `${RED}All JSON files provided have to have the same structure, please check and try again.${RESET}`,
        );
      }
    });
  } else {
    // No comparisson checks required - just createFileAtDestination
    await createFileAtDestination(
      [{ chunk: JSON.stringify(originJSON), type: FileType.CSV }],
      'test-aggregated-csv',
      destination,
    );
  }
};
// aggregateJSONToCSV(
//   ['./test-data/origin/dummy1.json'],
//   './test-data/destination/aggregated',
// );
aggregateJSONToCSV(
  ['./test-data/origin/dummy1.json', './test-data/origin/dummy1.json'],
  './test-data/destination/aggregated',
);

// const jsonFile = await getDataFromOriginFile('./test-data/origin/dummy1.json');
// const csvFile = await getDataFromOriginFile('./test-data/origin/dummy1.csv');

// createFileAtDestination(jsonFile as [], './test-data/destination');

// convertFile(
//   './test-data/origin/dummy1.csv',
//   FileType.JSON,
//   './test-data/destination/converted',
// );
