import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FloorMap } from "@/components/FloorMap";
import { useCourses } from "@/state/CoursesContext";

export default function FloorScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = useCourses().courses.find(c => c.id === id);

  if (!course) return <Redirect href="/" />;

  return (
    <FloorMap
      course={course}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: "/campus/[id]", params: { id: course.id } })
      }
    />
  );
}
