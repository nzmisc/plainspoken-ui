"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type ReactNode } from "react";
import { CARDS_BY_ID } from "@/registry/plainspoken/blocks/kanban/data";
import { KanbanApp } from "@/registry/plainspoken/blocks/kanban/kanban-app";

/** The address of a card: this page with ?card=FA-110 */
const linkTo = (cardId: string) => {
  const url = new URL(window.location.href);
  url.searchParams.set("card", cardId);
  return url.href;
};

/** Opens the card named in the address (?card=FA-110). Reads the search params, so it sits in its own Suspense boundary. */
function CardFromAddress({ onCard }: { onCard: (cardId: string) => void }) {
  const card = useSearchParams().get("card");
  useEffect(() => {
    if (card && CARDS_BY_ID[card]) onCard(card);
  }, [card, onCard]);
  return null;
}

/**
 * The board as it is at /demos/kanban: the open card is kept in the address, so a card can be
 * linked to, and Copy link gives that address. The board itself renders without waiting for it.
 */
export function KanbanDemo({ actions, className }: { actions?: ReactNode; className?: string }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <KanbanApp
        openCardId={open}
        onOpenCardChange={(cardId) => {
          setOpen(cardId);
          const url = new URL(window.location.href);
          if (cardId) url.searchParams.set("card", cardId);
          else url.searchParams.delete("card");
          window.history.replaceState(null, "", url);
        }}
        cardLink={linkTo}
        actions={actions}
        className={className}
      />
      <Suspense fallback={null}>
        <CardFromAddress onCard={setOpen} />
      </Suspense>
    </>
  );
}
