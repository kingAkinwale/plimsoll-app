"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ago } from "@plimsoll/sdk";
import { config, explorer } from "@/lib/config";
import { loadIndexerStatus, type IndexerStatus } from "@/lib/data";
import { PlimsollMark } from "./ui";

const NAV = [
  { href: "/", label: "Assets" },
  { href: "/reporters/", label: "Reporters" },
  { href: "/mainnet/", label: "Mainnet watch" },
  { href: "/report/", label: "Post a report" },
  { href: "/list/", label: "List an asset" },
  { href: "/integrate/", label: "Integrate" },
  { href: "/about/", label: "How it works" },
  { href: "/settings/", label: "Alert settings" },
];

const DOCS_URL = "https://plimsoll-protocol.gitbook.io/plimsoll-protocol-docs/";

export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [prevPath, setPrevPath] = useState(path);
  const button = useRef<HTMLButtonElement>(null);
  const nav = useRef<HTMLElement>(null);

  // Navigating closes the menu.
  if (prevPath !== path) {
    setPrevPath(path);
    setOpen(false);
  }

  // Escape closes the menu and returns focus to its button; opening moves focus to the first link.
  useEffect(() => {
    if (!open) return;
    nav.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="brand">
          <PlimsollMark />
          Plimsoll
        </Link>
        <span className="net-pill">{config.networkName}</span>
        <button
          ref={button}
          type="button"
          className="nav-toggle secondary"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((o) => !o)}
        >
          {open ? "Close" : "Menu"}
          <span className="sr-only"> navigation</span>
        </button>
        <nav
          id="site-nav"
          ref={nav}
          className="nav"
          data-open={open ? "true" : "false"}
          aria-label="Main"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={
                path === item.href || (item.href !== "/" && path?.startsWith(item.href))
                  ? "page"
                  : undefined
              }
            >
              {item.label}
            </Link>
          ))}
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            Docs
          </a>
        </nav>
      </div>
    </header>
  );
}

export function IndexerStatusIndicator({
  status: initialStatus,
}: {
  status?: IndexerStatus | null;
}) {
  const [status, setStatus] = useState<IndexerStatus | null | undefined>(initialStatus);
  const [prevInitial, setPrevInitial] = useState(initialStatus);

  if (prevInitial !== initialStatus) {
    setPrevInitial(initialStatus);
    setStatus(initialStatus);
  }

  useEffect(() => {
    if (initialStatus !== undefined) return;
    if (!config.indexerUrl) {
      return;
    }
    let cancelled = false;
    loadIndexerStatus()
      .then((s) => {
        if (!cancelled) setStatus(s);
      })
      .catch(() => {
        if (!cancelled) setStatus({ state: "unreachable" });
      });
    return () => {
      cancelled = true;
    };
  }, [initialStatus]);

  if (!status) return null;

  const label =
    status.state === "ok"
      ? "Indexer: healthy"
      : status.state === "lagging"
        ? `Indexer: lagging${
            status.lastEventAgeSeconds !== undefined
              ? ` (last event ${ago(status.lastEventAgeSeconds)})`
              : ""
          }`
        : "Indexer: unreachable";

  return (
    <span
      className={`indexer-status ${status.state}`}
      data-testid="indexer-status"
      data-status={status.state}
      role="status"
    >
      <span className={`status-dot status-dot-${status.state}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}

export function Footer({ status }: { status?: IndexerStatus | null }) {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <span>
          Plimsoll — reserve coverage for Stellar-issued assets. Unaudited software on{" "}
          {config.networkName}.
        </span>
        <IndexerStatusIndicator status={status} />
        <span className="row">
          <a href={DOCS_URL} target="_blank" rel="noreferrer">
            Docs
          </a>
          <a
            href={explorer.contract(config.network.coverageLedgerId)}
            target="_blank"
            rel="noreferrer"
          >
            Coverage ledger
          </a>
          <a
            href="https://github.com/plimsoll-protocol/plimsoll-contracts"
            target="_blank"
            rel="noreferrer"
          >
            Contracts
          </a>
          <a
            href="https://github.com/plimsoll-protocol/plimsoll-app"
            target="_blank"
            rel="noreferrer"
          >
            App
          </a>
          <a
            href="https://github.com/plimsoll-protocol/plimsoll-indexer"
            target="_blank"
            rel="noreferrer"
          >
            Indexer
          </a>
        </span>
      </div>
    </footer>
  );
}
