"use client";

import { useState } from "react";
import { Loader2, CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/primitives";
import { Textarea } from "@/components/ui/primitives";
import { supabase } from "@/lib/supabase";

export function ContactForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !message.trim()) {
      setError("Please fill in your name, phone, and message.");
      return;
    }

    setSubmitting(true);
    const { error: insertError } = await supabase.from("inquiries").insert({
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim().toLowerCase() || null,
      subject: subject.trim() || null,
      message: message.trim(),
    });
    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
        <CheckCircle2 className="h-10 w-10 text-success mx-auto mb-3" />
        <h3 className="font-display text-2xl">Message received</h3>
        <p className="text-muted-foreground mt-2">
          Thank you, {name}. We&apos;ll get back to you on{" "}
          <span className="font-mono">{phone}</span> shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="cf_name">Your name</Label>
          <Input
            id="cf_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cf_phone">Phone</Label>
          <Input
            id="cf_phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf_email">Email (optional)</Label>
        <Input
          id="cf_email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf_subject">Subject (optional)</Label>
        <Input
          id="cf_subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="e.g. Group booking for 8 people"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="cf_message">Message</Label>
        <Textarea
          id="cf_message"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="text-sm text-destructive bg-destructive/5 border border-destructive/30 rounded-md px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={submitting} size="lg" className="w-full">
        {submitting ? <Loader2 className="animate-spin" /> : <Send />}
        Send message
      </Button>
    </form>
  );
}
