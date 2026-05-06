export type SpecPriority = "HIGH" | "MEDIUM" | "LOW";
export type SpecStatus = "DRAFT" | "REVIEW" | "APPROVED" | "DEPRECATED";

export interface FeatureScreen {
  id: string;
  featureId: string;
  screenId: string;
  screen: Screen;
}

export interface Screen {
  id: string;
  name: string;
  description: string;
  path: string;
  imagePath: string;
  order: number;
  features: FeatureScreen[];
  createdAt: string;
  updatedAt: string;
}

export interface Specification {
  id: string;
  featureId: string;
  title: string;
  given: string;
  when: string;
  then: string;
  priority: SpecPriority;
  status: SpecStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface Feature {
  id: string;
  name: string;
  description: string;
  order: number;
  specs: Specification[];
  screens: FeatureScreen[];
  createdAt: string;
  updatedAt: string;
}

export const PRIORITY_LABEL: Record<SpecPriority, string> = {
  HIGH: "高",
  MEDIUM: "中",
  LOW: "低",
};

export const PRIORITY_COLOR: Record<SpecPriority, string> = {
  HIGH: "bg-red-100 text-red-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-green-100 text-green-700",
};

export const STATUS_LABEL: Record<SpecStatus, string> = {
  DRAFT: "下書き",
  REVIEW: "レビュー中",
  APPROVED: "承認済み",
  DEPRECATED: "廃止",
};

export const STATUS_COLOR: Record<SpecStatus, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  REVIEW: "bg-blue-100 text-blue-700",
  APPROVED: "bg-green-100 text-green-700",
  DEPRECATED: "bg-red-100 text-red-500",
};
