import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Location from "expo-location";
import { CAMPUS_GEO, geoToMap, type Point } from "@/data/campus";

export type LocationStatus =
  | "loading"       // 取得中
  | "ok"            // GPS の現在地を地図上に表示できている
  | "outside"       // キャンパスの外にいる
  | "denied"        // 位置情報が許可されていない
  | "unconfigured"  // キャンパスの緯度経度(CAMPUS_GEO)が未設定
  | "error";

export type CampusLocation = {
  status: LocationStatus;
  point: Point | null;     // 地図座標での現在地。ok のときだけ入る
  heading: number | null;  // 向いている方角(北 = 0°、時計回り)。取れない端末では null
};

/** GPS の現在地と端末の向きを、キャンパスマップの座標で返す */
export function useCampusLocation(): CampusLocation {
  const [status, setStatus] = useState<LocationStatus>("loading");
  const [point, setPoint] = useState<Point | null>(null);
  const [heading, setHeading] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const subs: Location.LocationSubscription[] = [];
    // 購読の開始を待っている間に画面が閉じられたら、すぐに止める
    const keep = (s: Location.LocationSubscription) => (cancelled ? s.remove() : subs.push(s));

    (async () => {
      try {
        // Web は方角が取れないので、緯度経度が未設定なら位置情報の許可を求める意味がない
        if (Platform.OS === "web" && !CAMPUS_GEO) { setStatus("unconfigured"); return; }

        const { granted } = await Location.requestForegroundPermissionsAsync();
        if (cancelled) return;
        if (!granted) { setStatus("denied"); return; }

        // 方角(Web では取れないので iOS / Android だけ)
        if (Platform.OS !== "web") {
          keep(await Location.watchHeadingAsync(h => {
            const deg = h.trueHeading >= 0 ? h.trueHeading : h.magHeading;
            if (deg >= 0) setHeading(deg);
          }));
        }

        if (cancelled) return;
        if (!CAMPUS_GEO) { setStatus("unconfigured"); return; }
        const geo = CAMPUS_GEO;
        keep(await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 3 },
          loc => {
            const p = geoToMap(loc.coords.latitude, loc.coords.longitude, geo);
            setPoint(p);
            setStatus(p ? "ok" : "outside");
          },
          () => setStatus("error"),
        ));
      } catch {
        if (!cancelled) setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      subs.forEach(s => s.remove());
    };
  }, []);

  return { status, point, heading };
}
