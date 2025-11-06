export type EventPayload =
  | {
      type: EventTypes.COGNITO_CREATE_USER;
      payload: {
        userId: string;
      };
    }
  | {
      type: EventTypes.UPDATE_VENDOR_SERVICE_AREA_COVERAGE;
      payload: {
        vendorId: string;
      };
    };

export enum EventTypes {
  COGNITO_CREATE_USER = 'cognito.createUser',
  UPDATE_VENDOR_SERVICE_AREA_COVERAGE = 'vendor.updateServiceAreaCoverage',
}
