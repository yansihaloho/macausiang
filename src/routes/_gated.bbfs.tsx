import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, RotateCcw, Layers } from "lucide-react";

export const Route = createFileRoute("/_gated/bbfs")({
  component: BbfsPage,
});

// ----- Helpers -----
function uniqDigits(s: string): string {
  const seen = new Set<string>();
  let out = "";
  for (const c of s.replace(/\D/g, "")) {
    if (!seen.has(c)) {
      seen.add(c);
      out += c;
    }
  }
  return out;
}

function cartesian(cols: string[]): string[] {
  if (cols.length === 0) return [];
  let acc: string[] = [""];
  for (const col of cols) {
    const chars = col.split("");
    const next: string[] = [];
    for (const p of acc) for (const c of chars) next.push(p + c);
    acc = next;
  }
  return acc;
}

// Permutations of length k from digits string (no digit reused per number)
function permutations(digits: string, k: number, allowTwin: boolean): string[] {
  const arr = digits.split("");
  const out: string[] = [];
  if (allowTwin) {
    // full cartesian of length k
    let acc: string[] = [""];
    for (let i = 0; i < k; i++) {
      const next: string[] = [];
      for (const p of acc) for (const c of arr) next.push(p + c);
      acc = next;
    }
    return acc;
  }
  const used = new Array(arr.length).fill(false);
  const cur: string[] = [];
  function rec() {
    if (cur.length === k) {
      out.push(cur.join(""));
      return;
    }
    for (let i = 0; i < arr.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      cur.push(arr[i]);
      rec();
      cur.pop();
      used[i] = false;
    }
  }
  rec();
  return out;
}

// ----- BBFS Section -----
function BbfsGenerator() {
  const [as, setAs] = useState("");
  const [kop, setKop] = useState("");
  const [kepala, setKepala] = useState("");
  const [ekor, setEkor] = useState("");
  const [splitter, setSplitter] = useState("*");
  const [generated, setGenerated] = useState<string[] | null>(null);

  const preview = useMemo(() => {
    const cols = [as, kop, kepala, ekor].map(uniqDigits).filter(Boolean);
    if (cols.length < 2) return null;
    return cartesian(cols);
  }, [as, kop, kepala, ekor]);

  function reset() {
    setAs("");
    setKop("");
    setKepala("");
    setEkor("");
    setSplitter("*");
    setGenerated(null);
  }

  function handleGenerate() {
    setGenerated(preview ?? []);
  }

  const rows = generated ?? [];
  const joined = rows.join(splitter === "\\n" ? "\n" : ` ${splitter} `);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Sparkles className="h-4 w-4 text-primary" /> BBFS Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          BBFS = bolak-balik full set. Isi minimal 2 kolom (AS / KOP / KEPALA / EKOR)
          untuk menghasilkan kombinasi Line. Full set 0–9 → 90 LN (2D), 720 LN (3D), 5040 LN (4D).
        </p>

        <div className="grid gap-3 md:grid-cols-6">
          <FieldDigits label="As" v={as} onChange={setAs} />
          <FieldDigits label="Kop" v={kop} onChange={setKop} />
          <FieldDigits label="Kepala" v={kepala} onChange={setKepala} />
          <FieldDigits label="Ekor" v={ekor} onChange={setEkor} />
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Pemisah
            </Label>
            <Select value={splitter} onValueChange={setSplitter}>
              <SelectTrigger className="font-mono">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="*">*</SelectItem>
                <SelectItem value="#">#</SelectItem>
                <SelectItem value=",">,</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="\n">Baris baru</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={handleGenerate} className="flex-1" size="sm">
              Generate
            </Button>
            <Button
              onClick={reset}
              variant="destructive"
              size="sm"
              className="gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        <div>
          <textarea
            readOnly
            value={joined}
            rows={6}
            className="w-full resize-y rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground"
            placeholder="Hasil kombinasi akan muncul di sini…"
          />
          <p className="mt-2 text-xs font-bold text-foreground">
            HASIL: <span className="font-mono text-primary">{rows.length}</span> LN
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

// ----- TARDAL Section -----
function TardalGenerator() {
  const [tardal, setTardal] = useState("");
  const [type, setType] = useState<"2" | "3" | "4">("2");
  const [twin, setTwin] = useState<"twin" | "notwin">("twin");
  const [splitter, setSplitter] = useState("*");
  const [generated, setGenerated] = useState<string[] | null>(null);

  function reset() {
    setTardal("");
    setType("2");
    setTwin("twin");
    setSplitter("*");
    setGenerated(null);
  }

  function handleGenerate() {
    const digits = uniqDigits(tardal);
    const k = Number(type);
    if (digits.length < 1) {
      setGenerated([]);
      return;
    }
    setGenerated(permutations(digits, k, twin === "twin"));
  }

  const rows = generated ?? [];
  const joined = rows.join(splitter === "\\n" ? "\n" : ` ${splitter} `);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Layers className="h-4 w-4 text-cyan-400" /> TARDAL — Kombinasi dari Angka Dasar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-muted-foreground">
          Masukkan angka dasar (unique digit). Pilih 2D/3D/4D dan mode twin.
          Twin = angka boleh berulang (mis. 11, 22). No Twin = tanpa pengulangan digit.
        </p>

        <div className="grid gap-3 md:grid-cols-6">
          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              TARDAL (angka dasar)
            </Label>
            <Input
              value={tardal}
              inputMode="numeric"
              maxLength={10}
              onChange={(e) => setTardal(e.target.value.replace(/\D/g, ""))}
              placeholder="mis. 012345"
              className="font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Tipe
            </Label>
            <Select value={type} onValueChange={(v) => setType(v as "2" | "3" | "4")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2D</SelectItem>
                <SelectItem value="3">3D</SelectItem>
                <SelectItem value="4">4D</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Twin
            </Label>
            <Select value={twin} onValueChange={(v) => setTwin(v as "twin" | "notwin")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="twin">Twin</SelectItem>
                <SelectItem value="notwin">No Twin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Pemisah
            </Label>
            <Select value={splitter} onValueChange={setSplitter}>
              <SelectTrigger className="font-mono"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="*">*</SelectItem>
                <SelectItem value="#">#</SelectItem>
                <SelectItem value=",">,</SelectItem>
                <SelectItem value="-">-</SelectItem>
                <SelectItem value="\n">Baris baru</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button
              onClick={handleGenerate}
              size="sm"
              className="flex-1 bg-cyan-500 text-white hover:bg-cyan-500/90"
            >
              Tardal
            </Button>
            <Button
              onClick={reset}
              variant="destructive"
              size="sm"
              className="gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
          </div>
        </div>

        <div>
          <textarea
            readOnly
            value={joined}
            rows={6}
            className="w-full resize-y rounded-lg border border-border bg-muted/40 p-3 font-mono text-xs text-foreground"
            placeholder="Hasil kombinasi TARDAL akan muncul di sini…"
          />
          <p className="mt-2 text-xs font-bold text-foreground">
            HASIL: <span className="font-mono text-cyan-400">{rows.length}</span> LN
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function FieldDigits({
  label,
  v,
  onChange,
}: {
  label: string;
  v: string;
  onChange: (s: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </Label>
      <Input
        value={v}
        inputMode="numeric"
        maxLength={10}
        placeholder={label}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ""))}
        className="font-mono"
      />
    </div>
  );
}

function BbfsPage() {
  return (
    <div className="space-y-6">
      <BbfsGenerator />
      <TardalGenerator />
    </div>
  );
}
