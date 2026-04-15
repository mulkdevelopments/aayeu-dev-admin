"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Save, ArrowLeft } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import useAxios from "@/hooks/useAxios";
import { showToast } from "@/components/_ui/toast-utils";
import Link from "next/link";

const SYSTEMS = ["EU", "IT", "FR", "DE", "US", "UK"];

export default function TableEditorPage() {
  const { id } = useParams();
  const router = useRouter();
  const [table, setTable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetType, setTargetType] = useState("alpha");
  const [rows, setRows] = useState([]);
  const { request } = useAxios();

  useEffect(() => {
    const fetch = async () => {
      const { data: res, error } = await request({
        method: "GET", url: `/admin/size-normalization/tables/${id}`, authRequired: true,
      });
      if (error) { showToast("error", error); router.push("/dashboard/size-normalization/tables"); return; }
      const t = res.data;
      setTable(t);
      setName(t.name);
      setDescription(t.description || "");
      setTargetType(t.target_type);
      setRows(t.rows.map((r) => ({ ...r, _key: r.id })));
      setLoading(false);
    };
    fetch();
  }, [id]);

  const addRow = () => {
    setRows((prev) => [...prev, { _key: `new_${Date.now()}`, system: "EU", source_value: "", target_value: "" }]);
  };

  const removeRow = (key) => {
    setRows((prev) => prev.filter((r) => r._key !== key));
  };

  const updateRow = (key, field, value) => {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...r, [field]: value } : r)));
  };

  const handleSave = async () => {
    if (!name.trim()) return showToast("error", "Name is required");
    const validRows = rows.filter((r) => r.system && r.source_value && r.target_value);
    if (validRows.length === 0) return showToast("error", "Add at least one conversion row");

    setSaving(true);
    const { error } = await request({
      method: "PUT",
      url: `/admin/size-normalization/tables/${id}`,
      authRequired: true,
      payload: {
        name, description, target_type: targetType,
        rows: validRows.map((r) => ({ system: r.system, source_value: r.source_value, target_value: r.target_value })),
      },
    });
    if (error) showToast("error", error);
    else showToast("success", "Table saved");
    setSaving(false);
  };

  const grouped = useMemo(() => {
    const targets = [...new Set(rows.map((r) => r.target_value).filter(Boolean))].sort((a, b) => {
      const na = parseFloat(a), nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return targets;
  }, [rows]);

  if (loading) {
    return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="animate-spin h-6 w-6" /></div>;
  }

  return (
    <div className="p-6 space-y-6">
      <CustomBreadcrumb />

      <div className="flex items-center gap-3">
        <Link href="/dashboard/size-normalization/tables">
          <Button variant="outline" size="sm"><ArrowLeft size={14} className="mr-1" /> Back</Button>
        </Link>
        <h1 className="text-xl font-semibold">Edit Conversion Table</h1>
      </div>

      {/* Table metadata */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <Label>Target Type</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="alpha">Alpha</SelectItem>
                  <SelectItem value="eu_shoe">EU Shoe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conversion Rows */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Conversion Rows ({rows.length})</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus size={14} className="mr-1" /> Add Row
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="animate-spin mr-1 h-4 w-4" /> : <Save size={14} className="mr-1" />}
              Save All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-xs uppercase text-gray-500">
                  <th className="text-left py-2 px-2 w-28">System</th>
                  <th className="text-left py-2 px-2 w-32">Source Size</th>
                  <th className="text-left py-2 px-2 w-32">Target ({targetType === "alpha" ? "Alpha" : "EU"})</th>
                  <th className="py-2 px-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._key} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-1.5 px-2">
                      <Select value={r.system} onValueChange={(v) => updateRow(r._key, "system", v)}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {SYSTEMS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="py-1.5 px-2">
                      <Input className="h-8" value={r.source_value} onChange={(e) => updateRow(r._key, "source_value", e.target.value)} placeholder="e.g. 38" />
                    </td>
                    <td className="py-1.5 px-2">
                      <Input className="h-8" value={r.target_value} onChange={(e) => updateRow(r._key, "target_value", e.target.value)} placeholder={targetType === "alpha" ? "e.g. M" : "e.g. 39"} />
                    </td>
                    <td className="py-1.5 px-2">
                      <Button variant="ghost" size="sm" onClick={() => removeRow(r._key)} className="h-8 w-8 p-0">
                        <Trash2 size={14} className="text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary grid */}
          {grouped.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Mapping Summary</h3>
              <div className="overflow-x-auto">
                <table className="text-xs border">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border px-2 py-1">Target</th>
                      {SYSTEMS.map((s) => <th key={s} className="border px-2 py-1">{s}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {grouped.map((target) => (
                      <tr key={target}>
                        <td className="border px-2 py-1 font-semibold">{target}</td>
                        {SYSTEMS.map((sys) => {
                          const match = rows.find((r) => r.system === sys && r.target_value === target);
                          return <td key={sys} className="border px-2 py-1 text-center">{match?.source_value || "—"}</td>;
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
