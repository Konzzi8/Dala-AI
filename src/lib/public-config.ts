export type PublicAppConfig = {
  name: string;
  features: {
    outlookOAuth: boolean;
    aiChat: boolean;
    aiEmailParse: boolean;
    cronSync: boolean;
  };
};
