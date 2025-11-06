import { County } from '@prisma/client';
import * as cities from './cities.json';
import * as counties from './counties.json';
import * as countries from './countries.json';
import * as states from './states.json';
import { City, Country, State } from './types';

const citiesJson = cities as City[];
const countiesJson = counties as County[];
const countriesJson = countries as Country[];
const statesJson = states as State[];

export { citiesJson, countiesJson, countriesJson, statesJson };
