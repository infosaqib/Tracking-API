export type GetInTouchInputType = {
  name: string;
  companyName: string;
  title: string;
  email: string;
  phoneNumber: string;
  phoneExtension?: string;
  city: string;
  state: string;
  zipCode: string;
  companyWebsite: string;
  unitCount?: number;
  message: string;
  assetUrl: string;
};

export type GetInTouchType = {
  type: 'get-in-touch-mail';
  data: GetInTouchInputType;
};
