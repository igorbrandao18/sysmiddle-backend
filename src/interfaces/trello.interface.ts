export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  closed: boolean;
}

export interface TrelloList {
  id: string;
  name: string;
  closed: boolean;
  pos: number;
  idBoard: string;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due: string | null;
  idList: string;
  idMembers: string[];
  labels: Array<{
    id: string;
    name: string;
    color: string;
  }>;
} 