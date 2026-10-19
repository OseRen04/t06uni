export type Course = {
  id: string;
  name: string;
  building: string;
  floor: number;
  roomNumber: string;
  professor: string;
  period: number; // 1–5
  day: number;    // 0=Mon … 4=Fri
  color: string;
};
