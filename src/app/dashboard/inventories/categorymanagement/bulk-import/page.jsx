"use client";

import React, { useEffect, useState } from "react";
import CustomBreadcrumb from "@/components/_ui/breadcrumb";
import { showToast } from "@/components/_ui/toast-utils";
import useAxios from "@/hooks/useAxios";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle, XCircle, AlertCircle, RefreshCw } from "lucide-react";
import categoryData from "../cat.json";

const BulkCategoryImport = () => {
  const [loading, setLoading] = useState(false);
  const [existingCategories, setExistingCategories] = useState([]);
  const [importLog, setImportLog] = useState([]);
  const [stats, setStats] = useState({ total: 0, created: 0, updated: 0, skipped: 0, failed: 0 });
  const { request } = useAxios();

  useEffect(() => {
    fetchExistingCategories();
  }, []);

  const fetchExistingCategories = async () => {
    try {
      const { data, error } = await request({
        method: "GET",
        url: "/admin/get-categories",
        authRequired: true,
      });
      if (error) throw new Error(error.message);
      setExistingCategories(data?.data || []);
      return data?.data || [];
    } catch (err) {
      showToast("error", err?.message || "Failed to fetch existing categories");
      return [];
    }
  };

  // Flatten existing categories to check for duplicates (include priority)
  const flattenCategories = (cats, result = []) => {
    for (const cat of cats) {
      result.push({
        id: cat.id,
        name: cat.name.toLowerCase(),
        slug: cat.slug,
        parent_id: cat.parent_id,
        priority: cat.priority || 0
      });
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, result);
      }
    }
    return result;
  };

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .trim()
      .replace(/&/g, "and")
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  };

  // Check if category exists
  const findExistingCategory = (name, parentId, flatList) => {
    const slug = generateSlug(name);
    return flatList.find(
      (cat) => cat.slug === slug && cat.parent_id === parentId
    );
  };

  // Add log entry
  const addLog = (message, status) => {
    setImportLog((prev) => [...prev, { message, status, time: new Date().toLocaleTimeString() }]);
  };

  // Create a single category
  const createCategory = async (name, parentId, priority = 1) => {
    const slug = generateSlug(name);
    const payload = {
      name: name,
      slug: slug,
      metadata: { icon: slug },
      priority: priority,
      parent_id: parentId || null,
    };

    const { data, error } = await request({
      method: "POST",
      url: "/admin/create-category",
      payload,
      authRequired: true,
    });

    if (error) throw new Error(error?.message || error);
    return data?.data;
  };

  // Update category priority
  const updateCategoryPriority = async (categoryId, name, slug, priority, parentId) => {
    const payload = {
      category_id: categoryId,
      name: name,
      slug: slug,
      priority: priority,
      parent_id: parentId || null,
    };

    const { data, error } = await request({
      method: "PUT",
      url: "/admin/update-category",
      payload,
      authRequired: true,
    });

    if (error) throw new Error(error?.message || error);
    return data?.data;
  };

  // Delay helper
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Process the category structure recursively
  const processCategories = async () => {
    setLoading(true);
    setImportLog([]);
    setStats({ total: 0, created: 0, updated: 0, skipped: 0, failed: 0 });

    // Refresh existing categories
    const freshCategories = await fetchExistingCategories();
    let flatList = flattenCategories(freshCategories);

    let totalCount = 0;
    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Count total items first
    const countItems = (obj) => {
      let count = 0;
      for (const key of Object.keys(obj)) {
        count++; // Count the key itself
        const value = obj[key];
        if (Array.isArray(value)) {
          count += value.length;
        } else if (typeof value === "object" && value !== null) {
          count += countItems(value);
        }
      }
      return count;
    };

    for (const rootKey of Object.keys(categoryData)) {
      totalCount += 1 + countItems(categoryData[rootKey]);
    }

    setStats((prev) => ({ ...prev, total: totalCount }));
    addLog(`Starting import of approximately ${totalCount} categories...`, "info");

    // Process root categories (Womenswear, Menswear)
    let rootPriority = 1;
    for (const [rootName, rootValue] of Object.entries(categoryData)) {
      try {
        // Check if root exists
        let rootCategory = findExistingCategory(rootName, null, flatList);

        if (!rootCategory) {
          addLog(`Creating root category: ${rootName} (priority: ${rootPriority})`, "pending");
          const created = await createCategory(rootName, null, rootPriority);
          rootCategory = { id: created.id, name: rootName.toLowerCase(), slug: created.slug, parent_id: null, priority: rootPriority };
          flatList.push(rootCategory);
          createdCount++;
          addLog(`Created: ${rootName} (priority: ${rootPriority})`, "success");
        } else {
          // Check if priority needs update
          if (rootCategory.priority !== rootPriority) {
            addLog(`Updating priority: ${rootName} (${rootCategory.priority} → ${rootPriority})`, "pending");
            await updateCategoryPriority(rootCategory.id, rootName, rootCategory.slug, rootPriority, null);
            rootCategory.priority = rootPriority;
            updatedCount++;
            addLog(`Updated: ${rootName} priority to ${rootPriority}`, "updated");
          } else {
            skippedCount++;
            addLog(`Skipped (exists, priority OK): ${rootName}`, "skipped");
          }
        }

        await delay(100);

        // Process second level (New in, Brands, Clothing, Shoes, etc.)
        let level2Priority = 1;
        for (const [level2Name, level2Value] of Object.entries(rootValue)) {
          try {
            let level2Category = findExistingCategory(level2Name, rootCategory.id, flatList);

            if (!level2Category) {
              addLog(`Creating: ${rootName} > ${level2Name} (priority: ${level2Priority})`, "pending");
              const created = await createCategory(level2Name, rootCategory.id, level2Priority);
              level2Category = { id: created.id, name: level2Name.toLowerCase(), slug: created.slug, parent_id: rootCategory.id, priority: level2Priority };
              flatList.push(level2Category);
              createdCount++;
              addLog(`Created: ${rootName} > ${level2Name} (priority: ${level2Priority})`, "success");
            } else {
              // Check if priority needs update
              if (level2Category.priority !== level2Priority) {
                addLog(`Updating priority: ${rootName} > ${level2Name} (${level2Category.priority} → ${level2Priority})`, "pending");
                await updateCategoryPriority(level2Category.id, level2Name, level2Category.slug, level2Priority, rootCategory.id);
                level2Category.priority = level2Priority;
                updatedCount++;
                addLog(`Updated: ${rootName} > ${level2Name} priority to ${level2Priority}`, "updated");
              } else {
                skippedCount++;
                addLog(`Skipped (exists, priority OK): ${rootName} > ${level2Name}`, "skipped");
              }
            }

            await delay(100);

            // Process third level (items in arrays or nested objects)
            if (Array.isArray(level2Value)) {
              // It's an array of items (like Clothing: ["Dresses", "Tops", ...])
              let level3Priority = 1;
              for (const itemName of level2Value) {
                try {
                  const existingItem = findExistingCategory(itemName, level2Category.id, flatList);

                  if (!existingItem) {
                    addLog(`Creating: ${rootName} > ${level2Name} > ${itemName} (priority: ${level3Priority})`, "pending");
                    const created = await createCategory(itemName, level2Category.id, level3Priority);
                    flatList.push({ id: created.id, name: itemName.toLowerCase(), slug: created.slug, parent_id: level2Category.id, priority: level3Priority });
                    createdCount++;
                    addLog(`Created: ${rootName} > ${level2Name} > ${itemName} (priority: ${level3Priority})`, "success");
                  } else {
                    // Check if priority needs update
                    if (existingItem.priority !== level3Priority) {
                      addLog(`Updating priority: ${itemName} (${existingItem.priority} → ${level3Priority})`, "pending");
                      await updateCategoryPriority(existingItem.id, itemName, existingItem.slug, level3Priority, level2Category.id);
                      existingItem.priority = level3Priority;
                      updatedCount++;
                      addLog(`Updated: ${rootName} > ${level2Name} > ${itemName} priority to ${level3Priority}`, "updated");
                    } else {
                      skippedCount++;
                      addLog(`Skipped (exists, priority OK): ${rootName} > ${level2Name} > ${itemName}`, "skipped");
                    }
                  }
                  level3Priority++;
                  await delay(50);
                } catch (err) {
                  failedCount++;
                  addLog(`Failed: ${rootName} > ${level2Name} > ${itemName} - ${err.message}`, "error");
                }
              }
            } else if (typeof level2Value === "object" && level2Value !== null) {
              // It's a nested object (like New in: { "What's New": [], ... })
              let level3Priority = 1;
              for (const [level3Name, level3Value] of Object.entries(level2Value)) {
                try {
                  let level3Category = findExistingCategory(level3Name, level2Category.id, flatList);

                  if (!level3Category) {
                    addLog(`Creating: ${rootName} > ${level2Name} > ${level3Name} (priority: ${level3Priority})`, "pending");
                    const created = await createCategory(level3Name, level2Category.id, level3Priority);
                    level3Category = { id: created.id, name: level3Name.toLowerCase(), slug: created.slug, parent_id: level2Category.id, priority: level3Priority };
                    flatList.push(level3Category);
                    createdCount++;
                    addLog(`Created: ${rootName} > ${level2Name} > ${level3Name} (priority: ${level3Priority})`, "success");
                  } else {
                    // Check if priority needs update
                    if (level3Category.priority !== level3Priority) {
                      addLog(`Updating priority: ${level3Name} (${level3Category.priority} → ${level3Priority})`, "pending");
                      await updateCategoryPriority(level3Category.id, level3Name, level3Category.slug, level3Priority, level2Category.id);
                      level3Category.priority = level3Priority;
                      updatedCount++;
                      addLog(`Updated: ${rootName} > ${level2Name} > ${level3Name} priority to ${level3Priority}`, "updated");
                    } else {
                      skippedCount++;
                      addLog(`Skipped (exists, priority OK): ${rootName} > ${level2Name} > ${level3Name}`, "skipped");
                    }
                  }

                  await delay(50);

                  // Process fourth level (arrays inside nested objects like "What's New": ["New in today", ...])
                  if (Array.isArray(level3Value) && level3Value.length > 0) {
                    let level4Priority = 1;
                    for (const level4Name of level3Value) {
                      try {
                        const existingLevel4 = findExistingCategory(level4Name, level3Category.id, flatList);

                        if (!existingLevel4) {
                          addLog(`Creating: ${rootName} > ${level2Name} > ${level3Name} > ${level4Name} (priority: ${level4Priority})`, "pending");
                          const created = await createCategory(level4Name, level3Category.id, level4Priority);
                          flatList.push({ id: created.id, name: level4Name.toLowerCase(), slug: created.slug, parent_id: level3Category.id, priority: level4Priority });
                          createdCount++;
                          addLog(`Created: ${rootName} > ${level2Name} > ${level3Name} > ${level4Name} (priority: ${level4Priority})`, "success");
                        } else {
                          // Check if priority needs update
                          if (existingLevel4.priority !== level4Priority) {
                            addLog(`Updating priority: ${level4Name} (${existingLevel4.priority} → ${level4Priority})`, "pending");
                            await updateCategoryPriority(existingLevel4.id, level4Name, existingLevel4.slug, level4Priority, level3Category.id);
                            existingLevel4.priority = level4Priority;
                            updatedCount++;
                            addLog(`Updated: ...${level3Name} > ${level4Name} priority to ${level4Priority}`, "updated");
                          } else {
                            skippedCount++;
                            addLog(`Skipped (exists, priority OK): ...${level3Name} > ${level4Name}`, "skipped");
                          }
                        }
                        level4Priority++;
                        await delay(30);
                      } catch (err) {
                        failedCount++;
                        addLog(`Failed: ${rootName} > ${level2Name} > ${level3Name} > ${level4Name} - ${err.message}`, "error");
                      }
                    }
                  }

                  level3Priority++;
                } catch (err) {
                  failedCount++;
                  addLog(`Failed: ${rootName} > ${level2Name} > ${level3Name} - ${err.message}`, "error");
                }
              }
            }

            level2Priority++;
          } catch (err) {
            failedCount++;
            addLog(`Failed: ${rootName} > ${level2Name} - ${err.message}`, "error");
          }
        }

        rootPriority++;
      } catch (err) {
        failedCount++;
        addLog(`Failed: ${rootName} - ${err.message}`, "error");
      }

      setStats({ total: totalCount, created: createdCount, updated: updatedCount, skipped: skippedCount, failed: failedCount });
    }

    setStats({ total: totalCount, created: createdCount, updated: updatedCount, skipped: skippedCount, failed: failedCount });
    addLog(`Import completed! Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`, "info");
    showToast("success", `Import completed! Created ${createdCount}, Updated ${updatedCount} categories.`);
    setLoading(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "updated":
        return <RefreshCw className="h-4 w-4 text-blue-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "skipped":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "pending":
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-4">
      <CustomBreadcrumb />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 gap-3">
        <h1 className="lg:text-3xl md:text-2xl text-xl font-bold">
          Bulk Category Import
        </h1>
        <Button
          onClick={processCategories}
          disabled={loading}
          className="bg-amber-600 hover:bg-amber-700"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            "Start Import"
          )}
        </Button>
      </div>

      <p className="text-gray-600 mt-2">
        This will create missing categories and update sorting order (priority) for existing ones based on the order in cat.json
      </p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-600">Total</p>
          <p className="text-2xl font-bold">{stats.total}</p>
        </div>
        <div className="bg-green-100 p-4 rounded-lg">
          <p className="text-sm text-green-600">Created</p>
          <p className="text-2xl font-bold text-green-700">{stats.created}</p>
        </div>
        <div className="bg-blue-100 p-4 rounded-lg">
          <p className="text-sm text-blue-600">Updated</p>
          <p className="text-2xl font-bold text-blue-700">{stats.updated}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded-lg">
          <p className="text-sm text-yellow-600">Skipped</p>
          <p className="text-2xl font-bold text-yellow-700">{stats.skipped}</p>
        </div>
        <div className="bg-red-100 p-4 rounded-lg">
          <p className="text-sm text-red-600">Failed</p>
          <p className="text-2xl font-bold text-red-700">{stats.failed}</p>
        </div>
      </div>

      {/* Preview */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Categories to Import (from cat.json)</h2>
        <p className="text-sm text-gray-500 mb-2">
          Categories will be assigned priority numbers based on their position (1st item = priority 1, 2nd = priority 2, etc.)
        </p>
        <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
          <pre className="text-xs">{JSON.stringify(categoryData, null, 2)}</pre>
        </div>
      </div>

      {/* Import Log */}
      {importLog.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Import Log</h2>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg max-h-96 overflow-y-auto font-mono text-sm">
            {importLog.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 py-1">
                {getStatusIcon(log.status)}
                <span className="text-gray-400">[{log.time}]</span>
                <span
                  className={
                    log.status === "error"
                      ? "text-red-400"
                      : log.status === "success"
                      ? "text-green-400"
                      : log.status === "updated"
                      ? "text-blue-400"
                      : log.status === "skipped"
                      ? "text-yellow-400"
                      : "text-gray-300"
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkCategoryImport;
