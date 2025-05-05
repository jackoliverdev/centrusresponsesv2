"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";

import { FunctionComponent, PropsWithChildren } from "react";

type Props = {};

export const CreateOrganizationModal: FunctionComponent<
  PropsWithChildren<Props>
> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    console.log("Creating organization:", organizationName);
    // Reset form and close modal
    setOrganizationName("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
          <DialogDescription>
            Enter the details for the new organization. Click save when
            you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="col-span-3"
              />
            </div>
            {/* Add more fields as needed */}
          </div>
          <DialogFooter>
            <Button type="submit">Save Organization</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
