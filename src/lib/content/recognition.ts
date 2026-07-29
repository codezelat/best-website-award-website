import { recognitionPageContent } from '../../data/recognition';
import type { RecognitionPageContent } from './types';

/**
 * Recognition content stays behind the public content-source boundary so a
 * future Neon and R2 implementation can replace this source without changing
 * the page or its components.
 */
export interface RecognitionContentSource {
  getRecognition(): Promise<RecognitionPageContent>;
}

class StaticRecognitionContentSource implements RecognitionContentSource {
  async getRecognition(): Promise<RecognitionPageContent> {
    return recognitionPageContent;
  }
}

const recognitionContentSource: RecognitionContentSource = new StaticRecognitionContentSource();

export function getRecognitionContent(): Promise<RecognitionPageContent> {
  return recognitionContentSource.getRecognition();
}
