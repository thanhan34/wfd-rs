export interface Question {
  id: string;
  type: 'WFD' | 'RS' | 'RA';
  content: string;
  questionNo: string;
}

export interface WFDQuestion extends Question {
  type: 'WFD';
  WFDNo: string;
}

export interface RSQuestion extends Question {
  type: 'RS';
  RSNo: string;
}

export interface RAQuestion extends Question {
  type: 'RA';
  RANo: string;
}
