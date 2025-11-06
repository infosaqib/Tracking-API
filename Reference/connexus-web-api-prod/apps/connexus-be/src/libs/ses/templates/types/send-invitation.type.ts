export type SendInvitationInputType = {
  name: string;
  link: string;
  assetUrl: string;
};

export type SendInvitationType = {
  type: 'custom-verification-email';
  data: SendInvitationInputType;
};
