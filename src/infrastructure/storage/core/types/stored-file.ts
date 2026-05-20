import { Visibility } from '../enums/visibility.enum';

export interface StoredFile {
  key: string;
  visibility: Visibility;
  size: number;
  mimeType: string;
}
