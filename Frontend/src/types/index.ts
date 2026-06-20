export type Category = "food" | "hotel" | "transport" | "flight" | "entertainment";

export type Balance =
  | { kind: "owed"; amount: number }
  | { kind: "owe"; amount: number }
  | { kind: "settled" };

export interface Participant {
  id: string;
  name: string;
  color: string;
  avatar_url?: string;
}

export interface Trip {
  id: string;
  name: string;
  dates: string;
  participants: Participant[];
  total: number;
  balance: Balance;
  categories: Category[];
  start_date?: string;
  end_date?: string;
}
