"use client";

import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { hashPin } from "@/lib/parent/settings";
import { getSupabase, type Db } from "@/lib/supabase/client";
import { Dashboard } from "./Dashboard";

type Stage =
  | { kind: "loading" }
  | { kind: "unconfigured" }
  | { kind: "signedOut" }
  | { kind: "pin"; user: User; hash: string | null }
  | { kind: "ready"; user: User }
  | { kind: "error"; message: string };

// Unlocked once per browser session, so a parent isn't asked again on every reload.
const UNLOCK_KEY = "nyamnyam.pinUnlocked";
const isUnlocked = (userId: string) => {
  try {
    return sessionStorage.getItem(UNLOCK_KEY) === userId;
  } catch {
    return false;
  }
};
const markUnlocked = (userId: string) => {
  try {
    sessionStorage.setItem(UNLOCK_KEY, userId);
  } catch {
    // Without storage the PIN is simply asked again next time.
  }
};

const KNOWN_ERRORS: Record<string, string> = {
  "Invalid login credentials": "이메일 또는 비밀번호가 맞지 않아요.",
  "Email not confirmed":
    "메일 인증을 먼저 해 주세요. 받은 메일의 링크를 누르면 돼요.",
  "User already registered": "이미 가입한 이메일이에요. 로그인해 주세요.",
};
const korean = (message: string) => KNOWN_ERRORS[message] ?? message;

export function ParentApp() {
  const [db] = useState(getSupabase);
  const [stage, setStage] = useState<Stage>(
    db ? { kind: "loading" } : { kind: "unconfigured" },
  );

  useEffect(() => {
    if (!db) return;
    let live = true;
    // Only the latest auth change may set the stage; a slow profile read that finishes
    // after a sign-out must not bring the previous parent back.
    let latest = 0;
    const enter = async (user: User | null) => {
      const request = ++latest;
      const current = () => live && request === latest;
      if (!user) return current() && setStage({ kind: "signedOut" });
      // First visit after sign-up: create the profile row the other tables hang off.
      const created = await db
        .from("profiles")
        .upsert({ id: user.id }, { onConflict: "id", ignoreDuplicates: true });
      const { data, error } = await db
        .from("profiles")
        .select("parent_pin_hash")
        .eq("id", user.id)
        .single();
      if (!current()) return;
      const failed = error ?? created.error;
      if (failed) return setStage({ kind: "error", message: failed.message });
      const hash = data?.parent_pin_hash ?? null;
      setStage(
        hash && isUnlocked(user.id)
          ? { kind: "ready", user }
          : { kind: "pin", user, hash },
      );
    };
    void db.auth
      .getSession()
      .then(({ data }) => enter(data.session?.user ?? null));
    const { data: sub } = db.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT")
        void enter(session?.user ?? null);
    });
    return () => {
      live = false;
      sub.subscription.unsubscribe();
    };
  }, [db]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">부모 설정</h1>
          <p className="text-sm text-muted-foreground">냠냠캔버스</p>
        </div>
        <div className="flex gap-2">
          <Link href="/play" className={buttonVariants({ variant: "outline" })}>
            아이 화면으로
          </Link>
          {stage.kind === "ready" || stage.kind === "pin" ? (
            <Button variant="ghost" onClick={() => void db?.auth.signOut()}>
              로그아웃
            </Button>
          ) : null}
        </div>
      </header>

      {stage.kind === "error" && (
        <Alert>
          <AlertTitle>보호자 정보를 불러오지 못했어요</AlertTitle>
          <AlertDescription className="grid gap-3">
            <span>{stage.message}</span>
            <Button className="w-fit" onClick={() => location.reload()}>
              다시 시도
            </Button>
          </AlertDescription>
        </Alert>
      )}
      {stage.kind === "loading" && (
        <p className="text-muted-foreground">불러오는 중…</p>
      )}
      {stage.kind === "unconfigured" && (
        <Alert>
          <AlertTitle>Supabase 가 연결되지 않았어요</AlertTitle>
          <AlertDescription>
            `.env.local` 에 NEXT_PUBLIC_SUPABASE_URL 과
            NEXT_PUBLIC_SUPABASE_ANON_KEY 를 넣어 주세요. 그 전까지 아이 화면은
            기본 설정으로 동작해요.
          </AlertDescription>
        </Alert>
      )}
      {stage.kind === "signedOut" && db && <AuthForm db={db} />}
      {stage.kind === "pin" && db && (
        <PinForm
          db={db}
          user={stage.user}
          hash={stage.hash}
          onUnlock={() => {
            markUnlocked(stage.user.id);
            setStage({ kind: "ready", user: stage.user });
          }}
        />
      )}
      {stage.kind === "ready" && db && <Dashboard db={db} />}
    </main>
  );
}

function AuthForm({ db }: { db: Db }) {
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const { data, error } =
      mode === "signIn"
        ? await db.auth.signInWithPassword({ email, password })
        : await db.auth.signUp({
            email,
            password,
            options: { emailRedirectTo: `${location.origin}/parent` },
          });
    setBusy(false);
    if (error) return setMessage(korean(error.message));
    if (mode === "signUp" && !data.session)
      setMessage(
        "확인 메일을 보냈어요. 메일의 링크를 누른 뒤 로그인해 주세요.",
      );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "signIn" ? "로그인" : "보호자 가입"}</CardTitle>
        <CardDescription>
          아이가 설정을 바꾸지 않도록 보호자 계정으로 들어와요.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password"
              type="password"
              autoComplete={
                mode === "signIn" ? "current-password" : "new-password"
              }
              minLength={6}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {message && (
            <p role="status" className="text-sm">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {mode === "signIn" ? "로그인" : "가입하기"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setMode(mode === "signIn" ? "signUp" : "signIn");
                setMessage(null);
              }}
            >
              {mode === "signIn" ? "처음이에요 (가입)" : "이미 계정이 있어요"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

const PIN_PATTERN = /^\d{4}$/;

function PinForm({
  db,
  user,
  hash,
  onUnlock,
}: {
  db: Db;
  user: User;
  hash: string | null;
  onUnlock: () => void;
}) {
  // Setting a PIN: first time, or after re-checking the password ("forgot PIN").
  const [setting, setSetting] = useState(hash === null);
  const [forgot, setForgot] = useState(false);
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (forgot) {
      const { error } = await db.auth.signInWithPassword({
        email: user.email ?? "",
        password,
      });
      if (error) return setMessage(korean(error.message));
      setForgot(false);
      setSetting(true);
      return;
    }
    if (!PIN_PATTERN.test(pin))
      return setMessage("숫자 4자리로 입력해 주세요.");
    if (setting) {
      if (pin !== again) return setMessage("두 PIN 이 서로 달라요.");
      const { error } = await db
        .from("profiles")
        .update({ parent_pin_hash: await hashPin(user.id, pin) })
        .eq("id", user.id);
      if (error) return setMessage(error.message);
      return onUnlock();
    }
    if ((await hashPin(user.id, pin)) === hash) return onUnlock();
    setPin("");
    setMessage("PIN 이 맞지 않아요.");
  };

  const pinInput = (
    id: string,
    label: string,
    value: string,
    onChange: (v: string) => void,
  ) => (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        maxLength={4}
        pattern="\d{4}"
        required
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="w-32 text-center text-lg tracking-[0.5em]"
      />
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {forgot ? "비밀번호 확인" : setting ? "PIN 정하기" : "PIN 입력"}
        </CardTitle>
        <CardDescription>
          {forgot
            ? "로그인 비밀번호를 한 번 더 넣으면 PIN 을 새로 정할 수 있어요."
            : "아이가 실수로 설정에 들어오지 않도록 숫자 4자리를 써요."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          {forgot ? (
            <div className="grid gap-2">
              <Label htmlFor="re-password">비밀번호</Label>
              <Input
                id="re-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {pinInput("pin", setting ? "새 PIN" : "PIN", pin, setPin)}
              {setting && pinInput("pin-again", "한 번 더", again, setAgain)}
            </div>
          )}
          {message && (
            <p role="status" className="text-sm text-destructive">
              {message}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit">
              {forgot ? "확인" : setting ? "저장" : "열기"}
            </Button>
            {!setting && !forgot && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setForgot(true)}
              >
                PIN 을 잊었어요
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
