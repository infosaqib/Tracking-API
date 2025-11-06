export interface GptPromptOptions {
  serviceName: string;
  serviceDescription: string;
  sowName: string;
  clientName: string;
  propertyIds: string[];
}

export interface GptMetadata {
  generatedAt: string;
  serviceName: string;
  propertyCount: number;
}

export interface GptResponse {
  markdown: string;
  comments: string;
  bottomComment: string;
  metadata: GptMetadata;
}
