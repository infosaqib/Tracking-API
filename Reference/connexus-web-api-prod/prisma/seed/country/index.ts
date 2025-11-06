/* eslint-disable no-console */
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { db } from '../db';
import { citiesJson, countiesJson, countriesJson, statesJson } from './data';
import { Country, State } from './types';

const writeJsonFile = async (path: string, data: any) => {
  await writeFile(path, JSON.stringify(data, null, 2));
};

export const saveCountriesData = async () => {
  const countriesData = await db.$queryRaw<Country[]>`
    SELECT id, "countryName", ST_AsGeoJSON(geom)::json as geom 
    FROM "Countries"
    WHERE "isDeleted" = false
  `;

  const countryPath = join(__dirname, 'countries.json');
  await writeJsonFile(countryPath, countriesData);
  console.log('Saved Countries');
};

export const saveStatesData = async () => {
  const statesData = await db.$queryRaw<State[]>`
    SELECT id, "stateName", "countryId", ST_AsGeoJSON(geom)::json as geom
    FROM "States"
    WHERE "isDeleted" = false
  `;

  const statePath = join(__dirname, 'states.json');
  await writeJsonFile(statePath, statesData);
  console.log('Saved States');
};

export const saveCitiesData = async () => {
  // const citiesData = await db.$queryRaw<City[]>`
  //   SELECT id, "cityName", "stateId", ST_AsGeoJSON(geom)::json as geom
  //   FROM "Cities"
  // `;

  const citiesData = await db.cities.findMany({
    select: {
      id: true,
      cityName: true,
      stateId: true,
    },
  });

  const cityPath = join(__dirname, 'cities.json');
  await writeJsonFile(cityPath, citiesData);
  console.log('Saved Cities');
};

export const saveCountiesData = async () => {
  const countiesData = await db.county.findMany({
    select: {
      id: true,
      name: true,
      stateId: true,
    },
  });

  const countyPath = join(__dirname, 'counties.json');
  await writeJsonFile(countyPath, countiesData);
  console.log('Saved Counties');
};

export const createJsonFiles = async () => {
  await saveCountriesData();
  await saveStatesData();
  await saveCitiesData();
  await saveCountiesData();
};

export const loadDataFromJson = async () => {
  try {
    await db.countries.createMany({
      data: countriesJson.map((c) => ({
        id: c.id,
        countryName: c.countryName,
      })),
      skipDuplicates: true,
    });

    await db.states.createMany({
      data: statesJson.map((s) => ({
        id: s.id,
        stateName: s.stateName,
        countryId: s.countryId,
      })),
      skipDuplicates: true,
    });

    await db.cities.createMany({
      data: citiesJson.map((c) => ({
        id: c.id,
        cityName: c.cityName,
        stateId: c.stateId,
      })),
      skipDuplicates: true,
    });

    await db.county.createMany({
      data: countiesJson,
      skipDuplicates: true,
    });
  } catch (error) {
    console.error('Error inserting data:', error);
    throw error;
  }
};

const missingCities = async () => {
  console.log('Adding missing Maryland/Virginia cities...');

  try {
    const [maryland, virginia] = await db.$transaction([
      db.states.findFirst({
        where: {
          stateName: {
            equals: 'Maryland',
            mode: 'insensitive',
          },
        },
      }),
      db.states.findFirst({
        where: {
          stateName: {
            equals: 'Virginia',
            mode: 'insensitive',
          },
        },
      }),
    ]);

    if (!maryland || !virginia) {
      console.error('Could not find Maryland or Virginia state.');
      return;
    }

    await db.$transaction([
      db.cities.createMany({
        data: [
          {
            cityName: 'Nottingham',
            stateId: maryland.id,
          },
          {
            cityName: 'Cantonsville',
            stateId: maryland.id,
          },
        ],
        skipDuplicates: true,
      }),
      db.county.createMany({
        data: [
          {
            name: 'Elizabeth',
            stateId: maryland.id,
          },
          {
            name: 'Warwick',
            stateId: virginia.id,
          },
        ],
        skipDuplicates: true,
      }),
    ]);
  } catch (error) {
    console.error('Transaction failed', error);
  }
};

export const countrySeed = async () => {
  // createJsonFiles();
  // await saveCitiesData();
  // await loadDataFromJson();
  await missingCities();
};
