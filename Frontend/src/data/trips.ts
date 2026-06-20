import type { Trip } from "../types";

export const trips: Trip[] = [
  {
    id: "goa",
    name: "Goa Vacation",
    dates: "12 – 17 Mar 2026",
    participants: [
      { name: "Aarav", color: "#AAD9BB" },
      { name: "Isha", color: "#F7DCB9" },
      { name: "Vikram", color: "#C9B7E0" },
      { name: "Neha", color: "#FBC4AB" },
      { name: "Rohan", color: "#B7D4E0" },
    ],
    total: 24500,
    balance: { kind: "owed", amount: 1200 },
    categories: ["food", "hotel", "transport", "entertainment"],
  },
  {
    id: "mumbai",
    name: "Mumbai Night Out",
    dates: "28 Apr 2026",
    participants: [
      { name: "Sara", color: "#F7DCB9" },
      { name: "Kabir", color: "#AAD9BB" },
      { name: "Meera", color: "#C9B7E0" },
    ],
    total: 4800,
    balance: { kind: "owe", amount: 650 },
    categories: ["food", "transport", "entertainment"],
  },
  {
    id: "manali",
    name: "Manali Trip",
    dates: "2 – 9 Feb 2026",
    participants: [
      { name: "Riya", color: "#AAD9BB" },
      { name: "Arjun", color: "#F7DCB9" },
      { name: "Tara", color: "#C9B7E0" },
      { name: "Dev", color: "#FBC4AB" },
      { name: "Anaya", color: "#B7D4E0" },
      { name: "Yash", color: "#E0CFB7" },
    ],
    total: 38000,
    balance: { kind: "settled" },
    categories: ["flight", "hotel", "food", "transport"],
  },
  {
    id: "coorg",
    name: "Coorg Weekend",
    dates: "18 – 20 Jan 2026",
    participants: [
      { name: "Priya", color: "#F7DCB9" },
      { name: "Karan", color: "#AAD9BB" },
      { name: "Zoya", color: "#C9B7E0" },
      { name: "Aman", color: "#FBC4AB" },
    ],
    total: 12300,
    balance: { kind: "owed", amount: 2100 },
    categories: ["hotel", "food", "transport"],
  },
];
