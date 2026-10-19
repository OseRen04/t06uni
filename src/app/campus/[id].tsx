import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { CampusMap } from "@/components/CampusMap";
import { useCourses } from "@/state/CoursesContext";

export default function CampusScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const course = useCourses().courses.find(c => c.id === id);

  if (!course) return <Redirect href="/" />;

  return (
    <CampusMap
      course={course}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      onEnterBuilding={() => router.push({ pathname: "/floor/[id]", params: { id: course.id } })}
    />
  );
}
