export type Category = "food" | "hotel" | "transport" | "flight" | "entertainment";

export type Balance =
  | { kind: "owed"; amount: number }
  | { kind: "owe"; amount: number }
  | { kind: "settled" };

export interface Participant {
  name: string;
  color: string;
}

export interface Trip {
  id: string;
  name: string;
  dates: string;
  participants: Participant[];
  total: number;
  balance: Balance;
  categories: Category[];
}
