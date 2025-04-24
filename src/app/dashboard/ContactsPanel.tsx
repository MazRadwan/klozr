"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface Contact {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  [key: string]: any;
}

export default function ContactsPanel() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchContacts() {
      setLoading(true);
      try {
        const res = await fetch("/api/contacts");
        if (!res.ok) throw new Error("Failed to fetch contacts");
        const data = await res.json();
        setContacts(data);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    fetchContacts();
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full rounded" />
          ))}
        </div>
      ) : error ? (
        <Alert variant="destructive" className="mb-4">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : contacts.length === 0 ? (
        <div className="text-gray-500">No contacts found.</div>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-x-auto bg-white dark:bg-gray-950">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact, i) => (
                <TableRow key={contact.id} className={i % 2 === 0 ? "bg-gray-50 dark:bg-gray-900/40" : ""}>
                  <TableCell>{contact.first_name || ""}</TableCell>
                  <TableCell>{contact.last_name || ""}</TableCell>
                  <TableCell>{contact.email || ""}</TableCell>
                  <TableCell>{contact.phone || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
