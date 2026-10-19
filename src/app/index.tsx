import { useRouter } from "expo-router";
import { Timetable } from "@/components/Timetable";
import { useCourses } from "@/state/CoursesContext";

export default function TimetableScreen() {
  const router = useRouter();
  const { courses, addCourse, deleteCourse } = useCourses();

  return (
    <Timetable
      courses={courses}
      onSelectCourse={c => router.push({ pathname: "/campus/[id]", params: { id: c.id } })}
      onDeleteCourse={deleteCourse}
      onAddCourse={addCourse}
    />
  );
}
