export interface FrontPluginContext {
  type: string;
  conversation?: {
    id: string;
    subject: string;
  };
  teammate?: {
    id: string;
    email: string;
    name: string;
  };
}
