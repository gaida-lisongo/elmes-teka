"use client";

import { useEffect, useRef, useState } from "react";

import { searchUsers, type UserSearchResult } from "@/actions/auth.actions";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";

interface UserSearchProps {
  selectedUserId: string;
  onSelect: (user: UserSearchResult | null, textValue: string) => void;
  error?: string;
}

export default function UserSearch({
  selectedUserId,
  onSelect,
  error,
}: UserSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedUserId || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setMessage(query.trim().length > 0 && query.trim().length < 2 ? "Saisissez au moins 2 caracteres." : "");
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setMessage("");

      const response = await searchUsers(query);

      if (response.success) {
        setResults(response.data);
        setIsOpen(true);
        setActiveIndex(response.data.length ? 0 : -1);
        setMessage(response.data.length ? "" : "Aucun utilisateur trouve.");
      } else {
        setResults([]);
        setMessage(response.message);
      }

      setIsLoading(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, selectedUserId]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectUser(user: UserSearchResult) {
    const label = `${user.pseudo} - ${user.email}`;
    setQuery(label);
    setIsOpen(false);
    setResults([]);
    onSelect(user, label);
  }

  function clearSelection() {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    setMessage("");
    onSelect(null, "");
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!isOpen || !results.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, results.length - 1));
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectUser(results[activeIndex]);
    }

    if (event.key === "Escape") {
      setIsOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Label>
        Identifiant <span className="text-error-500">*</span>
      </Label>
      <div className="relative">
        <Input
          type="text"
          placeholder="Pseudo, telephone ou e-mail"
          value={query}
          onChange={(event) => {
            const value = event.target.value;
            setQuery(value);
            onSelect(null, value);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          error={Boolean(error)}
          hint={error}
        />
        {selectedUserId && (
          <button
            type="button"
            onClick={clearSelection}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400"
          >
            Changer
          </button>
        )}
      </div>

      {(isOpen || isLoading || message) && !selectedUserId && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Recherche en cours...
            </div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((user, index) => (
                <li key={user.id}>
                  <button
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectUser(user)}
                    className={`w-full px-4 py-3 text-left text-sm ${
                      activeIndex === index
                        ? "bg-gray-100 dark:bg-white/[0.05]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="block font-medium text-gray-800 dark:text-white/90">
                      {user.pseudo}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {user.email} - {user.telephone} - {user.accountType || "Profil non detecte"} - {user.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && message && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
