"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning';
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = 'default'
}: ConfirmationModalProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
          confirmButton: "bg-red-600 hover:bg-red-700 text-white"
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          confirmButton: "bg-orange-600 hover:bg-orange-700 text-white"
        };
      default:
        return {
          icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white"
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {styles.icon}
            <DialogTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </DialogTitle>
          </div>
          <DialogDescription className="text-gray-600 dark:text-gray-400 mt-2">
            {description}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-3 sm:gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="text-gray-700 dark:text-gray-300"
          >
            {cancelText}
          </Button>
          <Button
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}