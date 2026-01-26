"use client";

import { useEffect, useMemo, useState } from "react";
import useAxios from "@/hooks/useAxios";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/_ui/toast-utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

const ManageBrandGroups = () => {
  const { request } = useAxios();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupBrands, setGroupBrands] = useState([]);
  const [allBrands, setAllBrands] = useState([]);

  const [groupForm, setGroupForm] = useState({
    name: "",
    rank: 1,
    active: true,
  });

  const [brandSearch, setBrandSearch] = useState("");
  const [brandRank, setBrandRank] = useState(1);

  useEffect(() => {
    document.title = "Manage Brand Groups";
  }, []);

  useEffect(() => {
    fetchGroups();
    fetchAllBrands();
  }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/brand-groups",
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to fetch groups");
        return;
      }
      setGroups(data?.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBrands = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/users/get-all-brands",
      });
      if (!error && data?.success) {
        setAllBrands((data?.data || []).map((b) => b.brand_name).filter(Boolean));
      }
    } catch (err) {
      console.error("Failed to load brands", err);
    }
  };

  const fetchGroupBrands = async (groupId) => {
    setLoading(true);
    try {
      const { data, error } = await request({
        method: "GET",
        url: `/admin/brand-group-brands?group_id=${groupId}`,
        authRequired: true,
      });
      if (error) {
        showToast("error", "Failed to fetch group brands");
        return;
      }
      setGroupBrands(data?.data?.items || []);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupForm.name.trim()) {
      showToast("error", "Group name is required");
      return;
    }
    const payload = {
      name: groupForm.name.trim(),
      rank: Number(groupForm.rank) || 1,
      active: !!groupForm.active,
    };
    const { error } = await request({
      method: "POST",
      url: "/admin/brand-groups",
      payload,
      authRequired: true,
    });
    if (error) {
      showToast("error", "Failed to create group");
      return;
    }
    showToast("success", "Group created");
    setGroupForm({ name: "", rank: 1, active: true });
    await fetchGroups();
  };

  const handleDeleteGroup = async (groupId) => {
    const { error } = await request({
      method: "DELETE",
      url: `/admin/brand-groups/${groupId}`,
      authRequired: true,
    });
    if (error) {
      showToast("error", "Failed to delete group");
      return;
    }
    showToast("success", "Group deleted");
    setSelectedGroup(null);
    setGroupBrands([]);
    fetchGroups();
  };

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    fetchGroupBrands(group.id);
  };

  const handleAddBrand = async () => {
    if (!selectedGroup) return;
    const brandName = brandSearch.trim();
    if (!brandName) return;
    const { error } = await request({
      method: "POST",
      url: "/admin/brand-group-brands",
      payload: {
        group_id: selectedGroup.id,
        brand_name: brandName,
        rank: Number(brandRank) || 1,
      },
      authRequired: true,
    });
    if (error) {
      showToast("error", "Failed to add brand");
      return;
    }
    setBrandSearch("");
    setBrandRank(1);
    fetchGroupBrands(selectedGroup.id);
  };

  const handleRemoveBrand = async (id) => {
    const { error } = await request({
      method: "DELETE",
      url: `/admin/brand-group-brands/${id}`,
      authRequired: true,
    });
    if (error) {
      showToast("error", "Failed to remove brand");
      return;
    }
    showToast("success", "Brand removed");
    fetchGroupBrands(selectedGroup.id);
  };

  const filteredBrands = useMemo(() => {
    if (!brandSearch) return [];
    const term = brandSearch.toLowerCase();
    return allBrands
      .filter((b) => b.toLowerCase().includes(term))
      .slice(0, 8);
  }, [allBrands, brandSearch]);

  return (
    <div className="p-6">
      <CustomBreadcrumb tail="Brand Groups" />
      <div className="flex flex-col gap-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="w-full lg:w-1/3 border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Create Group</h2>
            <form onSubmit={handleCreateGroup} className="space-y-3">
              <Input
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                placeholder="Group name (e.g. Iconic Brands)"
              />
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  value={groupForm.rank}
                  onChange={(e) => setGroupForm({ ...groupForm, rank: e.target.value })}
                  placeholder="Rank"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={groupForm.active}
                    onChange={(e) => setGroupForm({ ...groupForm, active: e.target.checked })}
                  />
                  Active
                </label>
              </div>
              <Button type="submit" disabled={loading}>
                Add Group
              </Button>
            </form>
          </div>

          <div className="w-full lg:w-2/3 border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">Groups</h2>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => (
                  <TableRow key={group.id}>
                    <TableCell>
                      <button
                        type="button"
                        onClick={() => handleSelectGroup(group)}
                        className="text-left text-sm hover:underline"
                      >
                        {group.name}
                      </button>
                    </TableCell>
                    <TableCell>{group.rank || "-"}</TableCell>
                    <TableCell>{group.active ? "Active" : "Inactive"}</TableCell>
                    <TableCell className="text-right">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete group?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will remove the group and its brand mappings.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGroup(group.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
                {!groups.length && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-6">
                      No groups created yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {selectedGroup && (
          <div className="border rounded-xl p-4">
            <h2 className="text-lg font-semibold mb-3">
              Brands in {selectedGroup.name}
            </h2>

            <div className="flex flex-col md:flex-row gap-3 mb-4">
              <Input
                value={brandSearch}
                onChange={(e) => setBrandSearch(e.target.value)}
                placeholder="Search and select brand"
              />
              <Input
                type="number"
                min={1}
                value={brandRank}
                onChange={(e) => setBrandRank(e.target.value)}
                placeholder="Rank"
              />
              <Button onClick={handleAddBrand}>Add Brand</Button>
            </div>

            {brandSearch && filteredBrands.length > 0 && (
              <div className="border rounded-lg p-2 mb-4 max-h-48 overflow-y-auto">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setBrandSearch(brand)}
                    className="block w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Brand</TableHead>
                  <TableHead>Rank</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupBrands.map((brand) => (
                  <TableRow key={brand.id}>
                    <TableCell>{brand.brand_name}</TableCell>
                    <TableCell>{brand.rank || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveBrand(brand.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!groupBrands.length && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-6">
                      No brands in this group
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageBrandGroups;
