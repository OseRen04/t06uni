import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { CampusMap } from "@/components/CampusMap";
import { resolveDestination, toParams, type DestinationParams } from "@/lib/destination";
import { useCourses } from "@/state/CoursesContext";

export default function CampusScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<DestinationParams>();
  const resolved = resolveDestination(params, useCourses().courses);

  if (!resolved) return <Redirect href="/" />;
  const { destination, course } = resolved;

  return (
    <CampusMap
      destination={destination}
      course={course}
      onBack={() => (router.canGoBack() ? router.back() : router.replace("/"))}
      onEnterBuilding={() => router.push({ pathname: "/floor", params: toParams(destination, course) })}
    />
  );
}
