"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function TestPage() {
  const [essay, setEssay] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    setOutput("");
    setError("");
    setLoading(true);

    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ essay }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "요청에 실패했습니다.");
      setLoading(false);
      return;
    }

    const reader = res.body!.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      setOutput((prev) => prev + decoder.decode(value, { stream: true }));
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-8">
      <Textarea
        rows={8}
        value={essay}
        onChange={(e) => setEssay(e.target.value)}
        placeholder="자기소개서를 붙여넣으세요"
      />
      <Button onClick={handleSubmit} disabled={loading || !essay}>
        {loading ? "첨삭 중..." : "첨삭받기"}
      </Button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <pre className="whitespace-pre-wrap text-sm">{output}</pre>
    </main>
  );
}
