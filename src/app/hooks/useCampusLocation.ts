import { useCallback, useEffect, useState } from "react";
import { CAMPUS_GEO, geoToMap, type Point } from "../data/campus";

export type LocationStatus =
  | "loading"       // 取得中
  | "ok"            // GPS の現在地を地図上に表示できている
  | "outside"       // キャンパスの外にいる
  | "denied"        // 位置情報が許可されていない
  | "unconfigured"  // キャンパスの緯度経度(CAMPUS_GEO)が未設定
  | "error";

// 方角センサーの状態。iPhone の Safari はボタンを押して許可を求める必要がある
export type HeadingPermission = "unneeded" | "prompt" | "granted" | "denied";

export type CampusLocation = {
  status: LocationStatus;
  point: Point | null;      // 地図座標での現在地。ok のときだけ入る
  heading: number | null;   // 向いている方角(北 = 0°、時計回り)。取れない端末では null
  headingPermission: HeadingPermission;
  requestHeading: () => void;
};

type IOSOrientationEvent = DeviceOrientationEvent & { webkitCompassHeading?: number };
type OrientationEventCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

// PC のブラウザにも requestPermission があるが方角センサーはないので、タッチ端末だけを対象にする
const needsOrientationPermission = () =>
  typeof DeviceOrientationEvent !== "undefined" &&
  navigator.maxTouchPoints > 0 &&
  typeof (DeviceOrientationEvent as OrientationEventCtor).requestPermission === "function";

/** GPS の現在地と端末の向きを、キャンパスマップの座標で返す(ブラウザの Geolocation API と方角センサーを使う) */
export function useCampusLocation(): CampusLocation {
  const [status, setStatus] = useState<LocationStatus>(CAMPUS_GEO ? "loading" : "unconfigured");
  const [point, setPoint] = useState<Point | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [headingPermission, setHeadingPermission] = useState<HeadingPermission>(
    needsOrientationPermission() ? "prompt" : "unneeded"
  );

  // 現在地
  useEffect(() => {
    if (!CAMPUS_GEO) return;
    if (!("geolocation" in navigator)) { setStatus("error"); return; }
    const geo = CAMPUS_GEO;
    const id = navigator.geolocation.watchPosition(
      pos => {
        const p = geoToMap(pos.coords.latitude, pos.coords.longitude, geo);
        setPoint(p);
        setStatus(p ? "ok" : "outside");
      },
      err => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error"),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // 方角(スマホのみ。PC のブラウザではイベントが来ないので null のまま)
  useEffect(() => {
    if (headingPermission === "prompt" || headingPermission === "denied") return;

    const onIOS = (e: Event) => {
      const h = (e as IOSOrientationEvent).webkitCompassHeading;
      if (typeof h === "number") setHeading(h);
    };
    const onAbsolute = (e: Event) => {
      const { alpha, absolute } = e as DeviceOrientationEvent;
      // alpha は反時計回りの角度なので、北 = 0°・時計回りに変換する
      if (absolute && alpha !== null) setHeading((360 - alpha) % 360);
    };
    window.addEventListener("deviceorientation", onIOS);
    window.addEventListener("deviceorientationabsolute", onAbsolute);
    return () => {
      window.removeEventListener("deviceorientation", onIOS);
      window.removeEventListener("deviceorientationabsolute", onAbsolute);
    };
  }, [headingPermission]);

  // iPhone の Safari では、ユーザーのタップから呼ばないと許可ダイアログが出ない
  const requestHeading = useCallback(() => {
    const ctor = DeviceOrientationEvent as OrientationEventCtor;
    ctor.requestPermission?.()
      .then(r => setHeadingPermission(r === "granted" ? "granted" : "denied"))
      .catch(() => setHeadingPermission("denied"));
  }, []);

  return { status, point, heading, headingPermission, requestHeading };
}
