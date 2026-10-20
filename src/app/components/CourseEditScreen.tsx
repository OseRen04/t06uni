import { useId, useRef, useState } from "react";
import { motion } from "motion/react";
import { AlertCircle } from "lucide-react";
import type { Course, NewCourse } from "../types";
import { CLASSROOM_BUILDINGS } from "../data/campus";
import { DAYS, PERIODS, formatDay, formatPeriod, formatSlot } from "../lib/schedule";
import { Chip, ChipGroup, ScreenHeader, TextField } from "./common";

type Props = {
  existingCourses: Course[];
  editing: Course;
  onSubmit: (data: NewCourse) => void;
  onBack: () => void;
};

// 登録済みの講義の内容を変更する画面(新しい講義の登録は CourseSearchScreen から)
export function CourseEditScreen({ existingCourses, editing, onSubmit, onBack }: Props) {
  const [name, setName] = useState(editing.name);
  const [building, setBuilding] = useState(editing.building);
  const [floor, setFloor] = useState(editing.floor);
  const [roomNumber, setRoomNumber] = useState(editing.roomNumber);
  const [professor, setProfessor] = useState(editing.professor);
  const [day, setDay] = useState(editing.day);
  const [period, setPeriod] = useState(editing.period);
  // 「保存する」を押してから、未入力のエラーを出す(入力中に出して急かさない)
  const [showErrors, setShowErrors] = useState(false);

  const formRef = useRef<HTMLFormElement>(null);
  const nameErrorId = useId();
  const roomErrorId = useId();
  const conflictId = useId();

  // 編集中の講義自身とは重複扱いしない
  const conflict = existingCourses.find(c => c.id !== editing.id && c.day === day && c.period === period);
  const nameError = name.trim() === "" ? "講義名を入力してください" : null;
  const roomError = roomNumber.trim() === "" ? "教室番号を入力してください" : null;
  const errors = [nameError, roomError, conflict ? "曜日・時限が他の講義と重なっています" : null].filter(Boolean) as string[];

  // 3.3.1 エラーの特定:保存できない理由を文字で示し、最初の問題の箇所へフォーカスを移す
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (errors.length === 0) {
      onSubmit({ name: name.trim(), building, floor, roomNumber: roomNumber.trim(), professor: professor.trim(), day, period });
      return;
    }
    setShowErrors(true);
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"], [data-conflict="true"] button[aria-pressed="true"]')?.focus();
    });
  };

  return (
    <motion.div
      className="flex flex-col h-full bg-white"
      initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
    >
      <ScreenHeader title="講義を編集" subtitle={editing.name} onBack={onBack} backLabel="時間割に戻る" />

      <form ref={formRef} id="course-edit-form" noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pt-4 pb-8">
        {/* 保存できない理由のまとめ(読み上げる) */}
        <div role="alert">
          {showErrors && errors.length > 0 && (
            <div className="flex gap-2 p-3 rounded-xl mb-4" style={{ backgroundColor: "#FCE8E6", border: "1px solid #C5221F" }}>
              <AlertCircle size={18} color="#A50E0E" className="flex-shrink-0 mt-0.5" aria-hidden="true" />
              <div style={{ fontSize: 14, color: "#A50E0E" }}>
                <p style={{ fontWeight: 700 }}>保存できません。次の{errors.length}件を確認してください。</p>
                <ul className="list-disc pl-5 mt-1">
                  {errors.map(e => <li key={e}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <TextField
              label="講義名" required value={name} onChange={setName} placeholder="例:マーケティング論"
              invalid={showErrors && !!nameError} describedBy={showErrors && nameError ? nameErrorId : undefined}
            />
            {showErrors && nameError && <FieldError id={nameErrorId}>{nameError}</FieldError>}
          </div>

          <TextField label="担当教員" value={professor} onChange={setProfessor} placeholder="例:田中 教授" />

          <div data-conflict={!!conflict}>
            <ChipGroup label="曜日" describedBy={conflict ? conflictId : undefined}>
              {DAYS.map((d, i) => (
                <Chip key={i} label={d} selected={day === i} onClick={() => setDay(i)} grow ariaLabel={formatDay(i)} />
              ))}
            </ChipGroup>
          </div>

          <div data-conflict={!!conflict}>
            <ChipGroup label="時限" describedBy={conflict ? conflictId : undefined}>
              {PERIODS.map(({ period: p }) => (
                <Chip key={p} label={formatPeriod(p)} selected={period === p} onClick={() => setPeriod(p)} grow />
              ))}
            </ChipGroup>
            {/* 重なりは選んだ時点で知らせる */}
            {conflict && (
              <FieldError id={conflictId}>
                {formatSlot(day, period)}にはすでに「{conflict.name}」があります。別の曜日・時限を選んでください
              </FieldError>
            )}
          </div>

          <ChipGroup label="棟">
            {CLASSROOM_BUILDINGS.map(b => (
              <Chip key={b} label={b} selected={building === b} onClick={() => setBuilding(b)} />
            ))}
          </ChipGroup>

          <ChipGroup label="階">
            {[1, 2, 3, 4].map(f => (
              <Chip key={f} label={`${f}F`} selected={floor === f} onClick={() => setFloor(f)} grow ariaLabel={`${f}階`} />
            ))}
          </ChipGroup>

          <div>
            <TextField
              label="教室番号" required value={roomNumber} onChange={setRoomNumber} placeholder="例:203"
              invalid={showErrors && !!roomError} describedBy={showErrors && roomError ? roomErrorId : undefined}
            />
            {showErrors && roomError && <FieldError id={roomErrorId}>{roomError}</FieldError>}
          </div>
        </div>
      </form>

      {/* 保存ボタンは画面下に固定。押せない状態にはせず、押したときに理由を示す */}
      <div className="bg-white px-4 pt-3 pb-8" style={{ boxShadow: "0 -1px 0 #DADCE0" }}>
        <button
          type="submit"
          form="course-edit-form"
          className="w-full rounded-2xl"
          style={{ minHeight: 52, fontSize: 16, fontWeight: 700, backgroundColor: "#1967D2", color: "white" }}
        >
          保存する
        </button>
      </div>
    </motion.div>
  );
}

function FieldError({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1 mt-1.5" style={{ fontSize: 13, color: "#A50E0E" }}>
      <AlertCircle size={15} color="#A50E0E" className="flex-shrink-0 mt-0.5" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}
