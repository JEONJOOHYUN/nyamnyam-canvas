"use client";

import Link from "next/link";
import { CalendarDays, Paintbrush, Plus, Scale } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getActiveChild, setActiveChild } from "@/lib/parent/settings";
import { possessive } from "@/lib/parent/words";
import type { Db } from "@/lib/supabase/client";
import type { ChildRow } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { DeviceTab } from "./DeviceTab";
import { History } from "./History";
import { SettingsForm } from "./SettingsForm";
import { CharacterArt, cardClass, goClass, hintClass, pillClass } from "./ui";

const tabClass =
  "tap-pop h-auto flex-none rounded-full px-3.5 py-2 text-[15px] font-bold text-[#1f4651] data-active:bg-[#1f4651] data-active:text-white data-active:hover:text-white";

export function Dashboard({
  db,
  onSignOut,
}: {
  db: Db;
  onSignOut: () => void;
}) {
  const [children, setChildren] = useState<ChildRow[] | null>(null);
  // The child picked here is the one who eats on this device, and whose settings show.
  const [selected, setSelected] = useState<string | null>(getActiveChild);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  // Bumped to refetch the list after an add or a theme change.
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);
  useEffect(() => {
    void db
      .from("children")
      .select("*")
      .order("created_at")
      .then(({ data, error: e }) => {
        if (e) return setError(e.message);
        setError(null);
        setChildren(data);
        // Nothing remembered on this device yet (or that child is gone): the first one eats here.
        const stored = getActiveChild();
        const remembered = data.some((c) => c.id === stored);
        if (data[0] && !remembered) setActiveChild(data[0].id);
        // Keep the current pick when it is still there, even if storage is blocked.
        setSelected((current) =>
          data.some((c) => c.id === current)
            ? current
            : remembered
              ? stored
              : (data[0]?.id ?? null),
        );
      });
  }, [db, version]);

  const select = (id: string) => {
    setActiveChild(id);
    setSelected(id);
  };
  const child =
    children?.find((c) => c.id === selected) ?? children?.[0] ?? null;

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col px-4 pt-5 pb-24 md:px-7 md:pt-6">
      <header className="flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="size-14.5 shrink-0 overflow-hidden rounded-full border-[3px] border-[#e8892b] bg-white">
            <CharacterArt
              character={child?.theme_character ?? "nyamnyam"}
              face
            />
          </span>
          <div>
            <p className="text-[12.5px] text-[#4b7280]">부모 설정</p>
            <h1 className="text-[25px] leading-tight font-extrabold tracking-tight md:text-3xl">
              {child ? `${possessive(child.name)} 식탁` : "냠냠캔버스"}
            </h1>
          </div>
        </div>
        <div className="flex gap-1.5">
          <Link href="/play" className={cn(buttonVariants(), pillClass)}>
            아이 화면으로
          </Link>
          <Button className={pillClass} onClick={onSignOut}>
            로그아웃
          </Button>
        </div>
      </header>

      {children && children.length > 0 && (
        <div
          role="group"
          aria-label="아이 고르기"
          className="mt-3.5 flex gap-2 overflow-x-auto pb-1"
        >
          {children.map((c) => (
            <Button
              key={c.id}
              aria-pressed={c.id === child?.id}
              onClick={() => select(c.id)}
              className="tap-pop btn-plain h-auto min-h-11 shrink-0 gap-2 rounded-full border-[3px] border-transparent py-1 pr-4 pl-1 text-[15px] font-medium text-[#1f4651] aria-pressed:border-[#e8892b]"
            >
              <span className="size-8.5 shrink-0 overflow-hidden rounded-full bg-[#fff3df]">
                <CharacterArt character={c.theme_character} face />
              </span>
              {c.name}
              {c.age ? ` ${c.age}살` : ""}
            </Button>
          ))}
          <Button
            aria-expanded={adding}
            onClick={() => setAdding(!adding)}
            className="tap-pop h-auto min-h-11 shrink-0 rounded-full border-2 border-dashed border-[#9bcfe4] bg-transparent px-4 text-[14px] text-[#4b7280] hover:bg-white/60"
          >
            <Plus />
            아이 추가
          </Button>
        </div>
      )}

      {(adding || children?.length === 0) && (
        <AddChild
          db={db}
          first={children?.length === 0}
          onAdded={(id) => {
            setAdding(false);
            select(id);
            reload();
          }}
        />
      )}

      {error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {children === null && !error && (
        <p className="mt-4 text-muted-foreground">불러오는 중…</p>
      )}

      {child && (
        <Tabs defaultValue="settings" className="mt-4.5 gap-3.5">
          <TabsList className="h-auto max-w-full group-data-horizontal/tabs:h-auto gap-1 overflow-x-auto rounded-full bg-white/70 p-1.5">
            <TabsTrigger value="settings" className={tabClass}>
              <Paintbrush />
              그림·설정
            </TabsTrigger>
            <TabsTrigger value="history" className={tabClass}>
              <CalendarDays />
              식사 기록
            </TabsTrigger>
            <TabsTrigger value="device" className={tabClass}>
              <Scale />
              저울
            </TabsTrigger>
          </TabsList>
          <TabsContent value="settings" className="text-base">
            <SettingsForm
              key={child.id}
              db={db}
              child={child}
              onChildSaved={reload}
            />
          </TabsContent>
          <TabsContent value="history" className="text-base">
            <History key={child.id} db={db} child={child} />
          </TabsContent>
          <TabsContent value="device" className="text-base">
            <DeviceTab db={db} />
          </TabsContent>
        </Tabs>
      )}
    </main>
  );
}

function AddChild({
  db,
  first,
  onAdded,
}: {
  db: Db;
  first: boolean;
  onAdded: (id: string) => void;
}) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    const { data, error } = await db
      .from("children")
      .insert({ name: name.trim(), age: age ? Number(age) : null })
      .select("id")
      .single();
    setBusy(false);
    if (error) return setMessage(error.message);
    setName("");
    setAge("");
    onAdded(data.id);
  };

  return (
    <form onSubmit={add} className={cn(cardClass, "mt-3")}>
      <h2 className="text-lg font-extrabold">
        {first ? "먼저 아이를 알려 주세요" : "아이 추가"}
      </h2>
      <p className={hintClass}>
        고른 아이가 이 기기에서 밥을 먹고, 그 아이의 설정과 기록이 보여요.
      </p>
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1.5">
          <Label htmlFor="child-name">이름</Label>
          <Input
            id="child-name"
            required
            maxLength={20}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-10 w-40 rounded-xl"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="child-age">나이</Label>
          <Input
            id="child-age"
            type="number"
            min={1}
            max={12}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="h-10 w-20 rounded-xl"
          />
        </div>
        <Button type="submit" disabled={busy} className={goClass}>
          추가하기
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-destructive">
          {message}
        </p>
      )}
    </form>
  );
}
