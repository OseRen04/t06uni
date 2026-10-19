import { useRouter } from "expo-router";
import { Timetable } from "@/components/Timetable";
import { toParams } from "@/lib/destination";
import { useCourses } from "@/state/CoursesContext";

export default function TimetableScreen() {
  const router = useRouter();
  const { courses, addCourse, updateCourse, deleteCourse } = useCourses();

  return (
    <Timetable
      courses={courses}
      onSelectCourse={c => router.push({ pathname: "/campus", params: toParams(c, c) })}
      onSelectPlace={p => router.push({ pathname: "/campus", params: toParams(p) })}
      onAddCourse={addCourse}
      onUpdateCourse={updateCourse}
      onDeleteCourse={deleteCourse}
    />
  );
}
