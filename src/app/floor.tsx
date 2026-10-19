import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { FloorMap } from "@/components/FloorMap";
import { resolveDestination, toParams, type DestinationParams } from "@/lib/destination";
import { useCourses } from "@/state/CoursesContext";

export default function FloorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<DestinationParams>();
  const resolved = resolveDestination(params, useCourses().courses);

  if (!resolved) return <Redirect href="/" />;
  const { destination, course } = resolved;

  return (
    <FloorMap
      destination={destination}
      course={course}
      onBack={() =>
        router.canGoBack()
          ? router.back()
          : router.replace({ pathname: "/campus", params: toParams(destination, course) })
      }
    />
  );
}
