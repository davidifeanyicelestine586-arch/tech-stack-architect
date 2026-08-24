export interface BlogReference {
  title: string;
  slug: string;
}

export interface Domain {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  icon: string;
  color: string;
  priority: number;
  tags: string[];
  blogReference?: BlogReference;
  supportedOutputs: string[];
}
