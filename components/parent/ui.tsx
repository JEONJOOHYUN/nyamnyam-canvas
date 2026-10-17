"use client";

import { useId, type CSSProperties, type ReactNode } from "react";
import "@/components/garden/garden.css";
import { Minus, Plus } from "lucide-react";
import {
  CHARACTERS,
  type GardenCharacterKey,
} from "@/components/garden/characters";
import { GardenScene } from "@/components/garden/GardenScene";
import type { GardenThemeKey } from "@/components/garden/themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

// Design A "놀이 친구": shared pieces for the parent screens.

export const COLORS = {
  ink: "#1f4651",
  orange: "#e8892b",
  sea: "#167f9d",
  space: "#6a4fc4",
  leaf: "#3aa55c",
  sun: "#ffd23f",
} as const;

export const THEME_COLOR: Record<GardenThemeKey, string> = {
  post: COLORS.orange,
  sea: COLORS.sea,
  space: COLORS.space,
};

export const cardClass =
  "grid content-start gap-3 rounded-3xl border-[3px] border-white bg-white p-4 shadow-[0_4px_0_#b9dff0]";
// White pill (secondary actions) and the orange "go" button.
export const pillClass =
  "tap-pop h-auto min-h-10 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#1f4651] shadow-[0_2px_0_#9bcfe4] hover:bg-[#f4fbff]";
export const goClass =
  "tap-pop h-auto min-h-11 rounded-full bg-[#e8892b] px-6 py-2.5 text-[17px] font-bold text-white shadow-[0_3px_0_#b8661a] hover:bg-[#d97c20]";
export const hintClass = "text-[12.5px] leading-snug text-[#567681]";

export function Section({
  n,
  color,
  title,
  wide,
  children,
}: {
  n?: number;
  color?: string;
  title: ReactNode;
  wide?: boolean;
  children: ReactNode;
}) {
  return (
    <section className={cn(cardClass, wide && "md:col-span-2")}>
      <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        {n !== undefined && (
          <b
            className="grid size-7.5 shrink-0 place-items-center rounded-full text-[15px] text-white"
            style={{ background: color }}
          >
            {n}
          </b>
        )}
        {title}
      </h2>
      {children}
    </section>
  );
}

function RowLabel({
  id,
  htmlFor,
  label,
  hint,
}: {
  id?: string;
  htmlFor?: string;
  label: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <span className="grid gap-0.5">
      <Label
        id={id}
        htmlFor={htmlFor}
        className="text-[15px] leading-snug font-medium"
      >
        {label}
      </Label>
      {hint && <span className={hintClass}>{hint}</span>}
    </span>
  );
}

export function SwitchRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <RowLabel htmlFor={id} label={label} hint={hint} />
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

// −/+ instead of a number field: no keyboard pops up on a phone.
export function StepperRow({
  label,
  hint,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: ReactNode;
  hint?: ReactNode;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  const id = useId();
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const stepButton =
    "size-9 rounded-full bg-white text-[#1f4651] shadow-[0_2px_0_#b9dff0] hover:bg-[#f4fbff]";
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <RowLabel id={id} label={label} hint={hint} />
      <div
        role="group"
        aria-labelledby={id}
        className="flex shrink-0 items-center gap-1 rounded-full bg-[#eef7fb] p-1"
      >
        <Button
          type="button"
          size="icon"
          className={stepButton}
          aria-label="줄이기"
          disabled={value <= min}
          onClick={() => onChange(clamp(value - step))}
        >
          <Minus className="size-4" />
        </Button>
        <output
          aria-live="polite"
          className="min-w-16 text-center font-bold tabular-nums"
        >
          {value}
          {unit}
        </output>
        <Button
          type="button"
          size="icon"
          className={stepButton}
          aria-label="늘리기"
          disabled={value >= max}
          onClick={() => onChange(clamp(value + step))}
        >
          <Plus className="size-4" />
        </Button>
      </div>
    </div>
  );
}

// A character drawn from the child screen's own SVG: the whole body, or with `face` head
// and shoulders for a round frame. The bust runs past the bottom of the box (slice), so
// the frame's circle (overflow-hidden rounded-full) is the edge, never a flat crop line.
const FULL_VIEW = { box: "-130 -240 260 270", width: 260 };
const BUST_VIEW = { box: "-85 -232 170 200", width: 170 };

export function CharacterArt({
  character,
  face,
  className,
}: {
  character: GardenCharacterKey;
  face?: boolean;
  className?: string;
}) {
  const { Component } = CHARACTERS[character];
  const view = face ? BUST_VIEW : FULL_VIEW;
  return (
    <span
      className={cn("character-art block size-full", className)}
      style={{ "--art-width": view.width } as CSSProperties}
    >
      <svg
        viewBox={view.box}
        preserveAspectRatio={face ? "xMidYMin slice" : undefined}
        aria-hidden="true"
        className="size-full"
      >
        <Component pose="hello" />
      </svg>
    </span>
  );
}

// A finished world as a small picture, the same scene the child grew.
export function WorldThumb({
  theme,
  character,
  className,
}: {
  theme: GardenThemeKey;
  character: GardenCharacterKey;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "relative block aspect-[4/3] w-full overflow-hidden",
        className,
      )}
    >
      <GardenScene
        theme={theme}
        character={character}
        progress={1}
        layout="wide"
        pose="hello"
        bubble={null}
      />
    </span>
  );
}
