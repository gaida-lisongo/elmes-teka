"use client";

import { useEffect, useRef, useState } from "react";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import { searchCustomers, createWorkspaceCustomer } from "@/actions/workspace.actions";

export interface CustomerResult {
  id: string;
  name: string;
  phone: string;
  email: string;
  matricule: string;
}

interface CustomerSearchProps {
  selectedCustomer: CustomerResult | null;
  onSelect: (customer: CustomerResult) => void;
  onClear: () => void;
}

export default function CustomerSearch({
  selectedCustomer,
  onSelect,
  onClear,
}: CustomerSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CustomerResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [creating, setCreating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedCustomer || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      setMessage(
        query.trim().length > 0 && query.trim().length < 2
          ? "Saisissez au moins 2 caracteres."
          : "",
      );
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setMessage("");
      const response = await searchCustomers(query);
      if (response.success) {
        setResults(response.data);
        setIsOpen(true);
        setActiveIndex(response.data.length ? 0 : -1);
        setMessage(response.data.length ? "" : "Aucun client trouve.");
      } else {
        setResults([]);
        setMessage(response.message);
      }
      setIsLoading(false);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query, selectedCustomer]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setShowCreate(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectCustomer(customer: CustomerResult) {
    setQuery("");
    setIsOpen(false);
    setResults([]);
    setShowCreate(false);
    onSelect(customer);
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
      selectCustomer(results[activeIndex]);
    }
    if (event.key === "Escape") {
      setIsOpen(false);
      setShowCreate(false);
    }
  }

  async function handleCreate() {
    if (newName.trim().length < 2) {
      setMessage("Le nom est requis.");
      return;
    }
    if (newPhone.trim().length < 8) {
      setMessage("Un numero de telephone valide est requis (min. 8 chiffres).");
      return;
    }
    setCreating(true);
    const r = await createWorkspaceCustomer({
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim() || undefined,
    });
    setCreating(false);
    if (r.success && r.data) {
      selectCustomer(r.data);
    } else {
      setMessage(r.message);
    }
  }

  if (selectedCustomer) {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-gray-800 dark:text-white/90">
              {selectedCustomer.name}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCustomer.phone}
              {selectedCustomer.email ? ` — ${selectedCustomer.email}` : ""}
            </p>
            <p className="text-xs text-gray-400">{selectedCustomer.matricule}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClear();
              setQuery("");
              setShowCreate(false);
            }}
            className="text-sm text-brand-500 hover:text-brand-600"
          >
            Changer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <Label>
        Rechercher un client <span className="text-error-500">*</span>
      </Label>
      <Input
        type="text"
        placeholder="Nom, telephone, email ou matricule..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setIsOpen(true);
          setShowCreate(false);
          setMessage("");
        }}
        onKeyDown={handleKeyDown}
      />

      {/* Bouton permanent pour creer un nouveau client */}
      <button
        type="button"
        onClick={() => {
          setShowCreate(!showCreate);
          setNewPhone("");
          setNewName("");
          setNewEmail("");
          setMessage("");
        }}
        className="mt-2 text-sm font-medium text-brand-500 hover:text-brand-600"
      >
        + Creer un nouveau client
      </button>

      {(isOpen || isLoading || message) && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              Recherche en cours...
            </div>
          )}
          {!isLoading && results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto py-1">
              {results.map((customer, index) => (
                <li key={customer.id}>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectCustomer(customer)}
                    className={`w-full px-4 py-3 text-left text-sm ${
                      activeIndex === index
                        ? "bg-gray-100 dark:bg-white/[0.05]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    }`}
                  >
                    <span className="block font-medium text-gray-800 dark:text-white/90">
                      {customer.name}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
                      {customer.phone}
                      {customer.email ? ` — ${customer.email}` : ""}
                      {" — "}
                      {customer.matricule}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {!isLoading && message && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
              {message}
            </div>
          )}
        </div>
      )}

      {showCreate && (
        <div className="mt-4 space-y-3 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-white/[0.03]">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Nouveau client
          </p>
          <div>
            <Label>Nom complet <span className="text-error-500">*</span></Label>
            <Input
              placeholder="Nom du client"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label>Telephone <span className="text-error-500">*</span></Label>
            <Input
              placeholder="Ex: 0812345678"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
            />
          </div>
          <div>
            <Label>Email (facultatif)</Label>
            <Input
              type="email"
              placeholder="client@exemple.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={creating}
            onClick={handleCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-50"
          >
            {creating ? "Creation..." : "Creer le client"}
          </button>
          {message && <p className="text-sm text-error-500">{message}</p>}
        </div>
      )}
    </div>
  );
}