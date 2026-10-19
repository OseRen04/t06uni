// 曜日・時限の表記はすべてこのファイルの関数を通して作る(画面ごとに表記がずれないようにする)

export const DAYS = ["月", "火", "水", "木", "金"];

export const PERIODS = [
  { period: 1, start: "8:50",  end: "10:20" },
  { period: 2, start: "10:30", end: "12:00" },
  { period: 3, start: "13:00", end: "14:30" },
  { period: 4, start: "14:40", end: "16:10" },
  { period: 5, start: "16:20", end: "17:50" },
];

/** 0 → 「月曜」 */
export const formatDay = (day: number) => `${DAYS[day]}曜`;

/** 1 → 「1限」 */
export const formatPeriod = (period: number) => `${period}限`;

/** 1 → 「8:50–10:20」 */
export function formatPeriodTime(period: number) {
  const p = PERIODS[period - 1];
  return p ? `${p.start}–${p.end}` : "";
}

/** (0, 1) → 「月曜 1限」 */
export const formatSlot = (day: number, period: number) => `${formatDay(day)} ${formatPeriod(period)}`;

/** (0, 1) → 「月曜 1限 8:50–10:20」 */
export const formatSlotWithTime = (day: number, period: number) =>
  `${formatSlot(day, period)} ${formatPeriodTime(period)}`;

/** 「104」→「104号室」。「アリーナ」のように番号でない教室名はそのまま */
export const formatRoom = (roomNumber: string) =>
  /^[\dA-Z]+$/i.test(roomNumber) ? `${roomNumber}号室` : roomNumber;

/** 「学部棟 1F 104号室」 */
export const formatLocation = (c: { building: string; floor: number; roomNumber: string }) =>
  `${c.building} ${c.floor}F ${formatRoom(c.roomNumber)}`;
