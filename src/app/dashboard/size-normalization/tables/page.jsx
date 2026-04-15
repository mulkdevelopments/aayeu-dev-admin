"use client";

import React, { useEffect, useState } from "react";
import { Loader2, PlusCircle, Pencil, Trash2, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import Link from "next/link";

export default function ConversionTablesPage() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState("alpha");
  const [creating, setCreating] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const { request } = useAxios();

  const fetch = async () => {
    setLoading(true);
    const { data: res, error } = await request({
      method: "GET", url: "/admin/size-normalization/tables", authRequired: true,
    });
    if (!error) setTables(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return showToast("error", "Name is required");
    setCreating(true);
    const { error } = await request({
      method: "POST",
      url: "/admin/size-normalization/tables",
      authRequired: true,
      payload: {
        name: newName, description: newDesc, target_type: newType,
        rows: [{ system: "EU", source_value: "38", target_value: newType === "alpha" ? "M" : "38" }],
      },
    });
    if (error) { showToast("error", error); }
    else { showToast("success", "Table created"); setShowCreate(false); setNewName(""); setNewDesc(""); fetch(); }
    setCreating(false);
  };

  const handleDelete = async () => {
    const { error } = await request({
      method: "DELETE", url: `/admin/size-normalization/tables/${deleteId}`, authRequired: true,
    });
    if (error) showToast("error", error);
    else { showToast("success", "Table deleted"); fetch(); }
    setDeleteId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conversion Tables</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetch}><RefreshCw size={14} className="mr-1" /> Refresh</Button>
            <Button size="sm" onClick={() => setShowCreate(true)}><PlusCircle size={14} className="mr-1" /> New Table</Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Rows</TableHead>
                <TableHead className="text-right">Assigned</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tables.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-0.5 text-xs rounded ${t.target_type === "alpha" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                      {t.target_type}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 max-w-[300px] truncate">{t.description || "—"}</TableCell>
                  <TableCell className="text-right">{t.row_count}</TableCell>
                  <TableCell className="text-right">{t.assigned_count}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link href={`/dashboard/size-normalization/tables/${t.id}`}>
                        <Button variant="outline" size="sm"><Pencil size={14} /></Button>
                      </Link>
                      <Button
                        variant="outline" size="sm"
                        disabled={t.assigned_count > 0}
                        onClick={() => setDeleteId(t.id)}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {tables.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No tables yet</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Conversion Table</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. WS Clothing Standard" />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Optional description" />
            </div>
            <div>
              <Label>Target Type</Label>
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alpha (XXS - 6XL)</SelectItem>
                  <SelectItem value="eu_shoe">EU Shoe Size</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button onClick={handleCreate} disabled={creating}>
              {creating && <Loader2 className="animate-spin mr-2 h-4 w-4" />} Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Conversion Table?</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-500">This action cannot be undone. The table and all its rows will be permanently deleted.</p>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
