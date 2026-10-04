"use client";

import { useRef, useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useUnsavedNavigation } from "@/hooks/use-unsaved-navigation";

export function WorkspaceModal({ title, description, close, children }: { title: string; description: string; close: () => void; children: ReactNode }) {
  const body = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const navigation = useUnsavedNavigation(dirty);
  function dismiss() {
    if (body.current?.querySelector(".animate-spin")) return;
    if (dirty) setConfirm(true);
    else close();
  }
  return <>
    <Dialog open onOpenChange={(open) => { if (!open) dismiss(); }}>
      <DialogContent className="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)] overflow-hidden rounded-lg p-0 sm:max-w-4xl">
        <DialogHeader className="border-b px-5 py-4 pr-12">
          <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div ref={body} onChangeCapture={() => setDirty(true)} onClickCapture={(event) => {
          const button = (event.target as Element).closest("button");
          if (button?.closest('[data-slot="dialog-content"]') !== body.current?.parentElement) return;
          if (["Close", "Cancel"].includes(button?.textContent?.trim() ?? "")) {
            event.preventDefault();
            event.stopPropagation();
            dismiss();
          }
          if (/^(Copy Monday|Add second range|Remove|Generate preview|Pattern|Paste list|Quick range)/.test(button?.textContent?.trim() ?? "")) setDirty(true);
        }} className="min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 [&>form]:border-0 [&>form]:bg-white [&>form]:p-0 [&>section]:border-0 [&>section]:bg-white [&>section]:p-0 [&>div]:border-0 [&>div]:bg-white [&>div]:p-0">{children}</div>
      </DialogContent>
    </Dialog>
    <AlertDialog open={confirm} onOpenChange={setConfirm}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle><AlertDialogDescription>Your saved settings will stay unchanged.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep editing</AlertDialogCancel><AlertDialogAction onClick={close}>Discard changes</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
    </AlertDialog>
    {navigation.guard}
  </>;
}
