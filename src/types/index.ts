export interface Question {
  id: string;
  type: 'WFD' | 'RS';
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
