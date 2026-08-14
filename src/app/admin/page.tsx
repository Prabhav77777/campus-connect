"use client";

import { useEffect, useState } from "react";
import {
  getOutlets,
  createOutlet,
  updateOutlet,
  deleteOutlet,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "@/actions/admin";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronUp,
  Power,
  PowerOff,
  Coffee,
  X,
} from "lucide-react";

type MenuItem = {
  id: string;
  name: string;
  price: number;
};

type Outlet = {
  id: string;
  name: string;
  hasFixedMenu: boolean;
  isClosed: boolean;
  menuItems: MenuItem[];
};

export default function AdminDashboard() {
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedOutlet, setExpandedOutlet] = useState<string | null>(null);

  // Modal states
  const [isOutletModalOpen, setIsOutletModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [outletForm, setOutletForm] = useState({ name: "", hasFixedMenu: true });

  const [isMenuModalOpen, setIsMenuModalOpen] = useState(false);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [menuForm, setMenuForm] = useState({ outletId: "", name: "", price: "" });

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: "outlet" | "menu";
    id: string;
  } | null>(null);

  const fetchOutlets = async () => {
    setIsLoading(true);
    try {
      const result = await getOutlets();
      if (result && "outlets" in result && result.outlets) {
        setOutlets(result.outlets as Outlet[]);
      }
    } catch (error) {
      console.error("Failed to fetch outlets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOutlets();
  }, []);

  // Handlers for Outlet
  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingOutlet) {
        await updateOutlet(editingOutlet.id, {
          name: outletForm.name,
          hasFixedMenu: outletForm.hasFixedMenu,
        });
      } else {
        await createOutlet({
          name: outletForm.name,
          hasFixedMenu: outletForm.hasFixedMenu,
        });
      }
      setIsOutletModalOpen(false);
      setEditingOutlet(null);
      setOutletForm({ name: "", hasFixedMenu: true });
      fetchOutlets();
    } catch (error) {
      console.error("Failed to save outlet:", error);
    }
  };

  const handleToggleStatus = async (outlet: Outlet) => {
    try {
      await updateOutlet(outlet.id, { isClosed: !outlet.isClosed });
      fetchOutlets();
    } catch (error) {
      console.error("Failed to toggle status:", error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      if (deleteConfirm.type === "outlet") {
        await deleteOutlet(deleteConfirm.id);
      } else {
        await deleteMenuItem(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      fetchOutlets();
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  // Handlers for Menu Items
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const price = parseFloat(menuForm.price);
      if (isNaN(price)) return;

      if (editingMenu) {
        await updateMenuItem(editingMenu.id, {
          name: menuForm.name,
          price,
        });
      } else {
        await createMenuItem({
          outletId: menuForm.outletId,
          name: menuForm.name,
          price,
        });
      }
      setIsMenuModalOpen(false);
      setEditingMenu(null);
      setMenuForm({ outletId: "", name: "", price: "" });
      fetchOutlets();
    } catch (error) {
      console.error("Failed to save menu item:", error);
    }
  };

  const openAddMenuModal = (outletId: string) => {
    setMenuForm({ outletId, name: "", price: "" });
    setEditingMenu(null);
    setIsMenuModalOpen(true);
  };

  const openEditMenuModal = (outletId: string, item: MenuItem) => {
    setMenuForm({ outletId, name: item.name, price: item.price.toString() });
    setEditingMenu(item);
    setIsMenuModalOpen(true);
  };

  const openEditOutletModal = (outlet: Outlet) => {
    setOutletForm({ name: outlet.name, hasFixedMenu: outlet.hasFixedMenu });
    setEditingOutlet(outlet);
    setIsOutletModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manage Outlets</h1>
          <p className="text-slate-500 text-sm mt-1">
            Configure campus outlets, their operating status, and menus.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingOutlet(null);
            setOutletForm({ name: "", hasFixedMenu: true });
            setIsOutletModalOpen(true);
          }}
          className="gap-2"
        >
          <Plus size={18} />
          Add Outlet
        </Button>
      </div>

      <div className="space-y-4">
        {outlets.length === 0 ? (
          <Card className="p-8 text-center bg-white border border-slate-200">
            <Coffee className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-lg font-medium text-slate-900">No outlets found</h3>
            <p className="text-slate-500 mt-1">Get started by creating a new outlet.</p>
          </Card>
        ) : (
          outlets.map((outlet) => (
            <Card key={outlet.id} className="overflow-hidden border border-slate-200 bg-white">
              {/* Outlet Header Row */}
              <div
                className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  expandedOutlet === outlet.id ? "bg-slate-50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  <div
                    className="cursor-pointer flex items-center gap-3 flex-1"
                    onClick={() =>
                      setExpandedOutlet(
                        expandedOutlet === outlet.id ? null : outlet.id
                      )
                    }
                  >
                    {outlet.hasFixedMenu ? (
                      <button className="text-slate-400 hover:text-slate-600">
                        {expandedOutlet === outlet.id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    ) : (
                      <div className="w-5" /> // Spacer for alignment
                    )}
                    <div>
                      <h3 className="font-semibold text-slate-800 text-lg">
                        {outlet.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={outlet.hasFixedMenu ? "info" : "default"}
                        >
                          {outlet.hasFixedMenu ? "Fixed Menu" : "Free Text"}
                        </Badge>
                        <Badge
                          variant={outlet.isClosed ? "danger" : "success"}
                        >
                          {outlet.isClosed ? "Closed" : "Open"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-2"
                    onClick={() => handleToggleStatus(outlet)}
                  >
                    {outlet.isClosed ? (
                      <>
                        <Power size={16} className="text-green-600" />
                        <span className="hidden sm:inline">Open</span>
                      </>
                    ) : (
                      <>
                        <PowerOff size={16} className="text-red-500" />
                        <span className="hidden sm:inline">Close</span>
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditOutletModal(outlet)}
                  >
                    <Pencil size={16} />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() =>
                      setDeleteConfirm({ type: "outlet", id: outlet.id })
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Menu Items Sub-table */}
              {expandedOutlet === outlet.id && outlet.hasFixedMenu && (
                <div className="border-t border-slate-200 bg-slate-50/50 p-4 sm:pl-14">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-medium text-slate-700">Menu Items</h4>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="gap-2"
                      onClick={() => openAddMenuModal(outlet.id)}
                    >
                      <Plus size={16} />
                      Add Item
                    </Button>
                  </div>

                  {!outlet.menuItems || outlet.menuItems.length === 0 ? (
                    <p className="text-sm text-slate-500 italic py-2">
                      No menu items yet.
                    </p>
                  ) : (
                    <div className="bg-white rounded-md border border-slate-200 overflow-hidden">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium">
                          <tr>
                            <th className="px-4 py-3 border-b border-slate-200">Item</th>
                            <th className="px-4 py-3 border-b border-slate-200">Price</th>
                            <th className="px-4 py-3 border-b border-slate-200 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outlet.menuItems.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-4 py-3 text-slate-800 font-medium">
                                {item.name}
                              </td>
                              <td className="px-4 py-3 text-slate-600">
                                ₹{item.price}
                              </td>
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  onClick={() => openEditMenuModal(outlet.id, item)}
                                  className="text-slate-400 hover:text-primary transition-colors p-1"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  onClick={() =>
                                    setDeleteConfirm({ type: "menu", id: item.id })
                                  }
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Outlet Modal */}
      {isOutletModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">
                {editingOutlet ? "Edit Outlet" : "Add Outlet"}
              </h3>
              <button
                onClick={() => setIsOutletModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveOutlet} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Outlet Name
                </label>
                <Input
                  required
                  value={outletForm.name}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, name: e.target.value })
                  }
                  placeholder="e.g. Nescafe, Student Corner"
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="hasFixedMenu"
                  checked={outletForm.hasFixedMenu}
                  onChange={(e) =>
                    setOutletForm({ ...outletForm, hasFixedMenu: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                />
                <label htmlFor="hasFixedMenu" className="text-sm text-slate-700 font-medium">
                  Has Fixed Menu Items
                </label>
              </div>
              <p className="text-xs text-slate-500 ml-7">
                If checked, you can add specific items with prices. If unchecked, students will enter custom requests.
              </p>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsOutletModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Outlet</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Menu Item Modal */}
      {isMenuModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-slate-100">
              <h3 className="font-semibold text-lg text-slate-800">
                {editingMenu ? "Edit Menu Item" : "Add Menu Item"}
              </h3>
              <button
                onClick={() => setIsMenuModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveMenu} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Item Name
                </label>
                <Input
                  required
                  value={menuForm.name}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, name: e.target.value })
                  }
                  placeholder="e.g. Cold Coffee"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price (₹)
                </label>
                <Input
                  required
                  type="number"
                  min="0"
                  step="1"
                  value={menuForm.price}
                  onChange={(e) =>
                    setMenuForm({ ...menuForm, price: e.target.value })
                  }
                  placeholder="e.g. 30"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsMenuModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Item</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6">
              <h3 className="font-semibold text-xl text-slate-900 mb-2">Confirm Deletion</h3>
              <p className="text-slate-600 mb-6">
                Are you sure you want to delete this {deleteConfirm.type}? 
                {deleteConfirm.type === "outlet" && " All associated menu items will also be deleted. This action cannot be undone."}
              </p>
              <div className="flex justify-end gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
