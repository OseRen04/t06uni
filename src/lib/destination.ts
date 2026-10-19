import type { Course } from "@/types";

// キャンパスマップ・フロアマップの行き先。
// 時間割の講義から開く場合は courseId、キャンパス自由検索から開く場合は棟・階・教室を URL パラメータで渡す
export type Destination = {
  building: string;
  floor?: number;
  roomNumber?: string;
  roomId?: string;
};

export type DestinationParams = {
  courseId?: string;
  building?: string;
  floor?: string;
  room?: string;
  roomId?: string;
};

export function toParams(d: Destination, course?: Course): Record<string, string> {
  if (course) return { courseId: course.id };
  const p: Record<string, string> = { building: d.building };
  if (d.floor !== undefined) p.floor = String(d.floor);
  if (d.roomNumber) p.room = d.roomNumber;
  if (d.roomId) p.roomId = d.roomId;
  return p;
}

export function resolveDestination(params: DestinationParams, courses: Course[]) {
  if (params.courseId) {
    const course = courses.find(c => c.id === params.courseId);
    if (!course) return null;
    const destination: Destination = { building: course.building, floor: course.floor, roomNumber: course.roomNumber };
    return { destination, course };
  }
  if (!params.building) return null;
  const floor = params.floor ? Number(params.floor) : undefined;
  const destination: Destination = {
    building: params.building,
    floor: Number.isFinite(floor) ? floor : undefined,
    roomNumber: params.room,
    roomId: params.roomId,
  };
  return { destination, course: undefined };
}
