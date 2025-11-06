import * as servicesSeedData from './service-seed.json';

export default servicesSeedData;

export type ServicesSeedData = typeof servicesSeedData;
export type SubServicesSeedData =
  ServicesSeedData[0]['service']['subServices'][0];
