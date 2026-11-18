export interface ErrorResult {
  success?: boolean;
  statusCode?: number;
  message?: string;
  data?: {
    correlationId?: string;
    stackTrace?: string;
    errors?: Record<string, string[]>;
    missingFields?: string[];
  };
  errors?: string[] | Record<string, string[]>;
  title?: string;
  detail?: string;
  status?: number;
  type?: string;
}
