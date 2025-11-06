export interface RouteControllerOptions {
  version: '1';
  security: 'protected' | 'public';
  addUserAbility: boolean;
  useBigIntSerializer?: boolean;
}
