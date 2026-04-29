import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion } from "framer-motion";
import { Users, UserPlus, Trash2 } from "lucide-react";

// STRICT ROLES
const ROLES = ["admin", "verification_officer"];

export default function UserManagement() {
  const { getToken } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const [createForm, setCreateForm] = useState({
    name: "", // Added name
    email: "",
    role: "verification_officer",
  });

  const [creating, setCreating] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      setUsers(data.filter(u => u.role !== "student"));
    } catch {
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);

    try {
      const token = await getToken();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      toast.success(data.message || "Staff user created");

      // Reset including name
      setCreateForm({ name: "", email: "", role: "verification_officer" });
      fetchUsers();

    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const updateRole = async (id, role) => {
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });

      toast.success("Role updated");
      fetchUsers();
    } catch {
      toast.error("Role update failed");
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this staff member?")) return;

    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("User deleted");
      fetchUsers();
    } catch {
      toast.error("Delete failed");
    }
  };

  // NEW FEATURE: Toggle Edit Access
  const toggleAccess = async (id) => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/admin/users/${id}/toggle-edit-access`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error("Failed to toggle access");
      }

      toast.success("Access updated");
      fetchUsers();
    } catch (err) {
      toast.error(err.message || "Toggle failed");
    }
  };

  // Improved search to include name and email
  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-6 py-10 space-y-10"
    >

      {/* HEADER */}
      <div className="flex items-center gap-3 text-indigo-700 text-3xl font-bold">
        <Users />
        Staff Management
      </div>

      {/* CREATE CARD */}
      <motion.div
        initial={{ opacity: 0, scale: .95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 backdrop-blur rounded-2xl shadow-xl p-6 border"
      >
        <h2 className="flex items-center gap-2 font-semibold text-lg mb-5">
          <UserPlus /> Create Staff
        </h2>

        {/* Updated grid-cols-4 to keep fields in a single row */}
        <form onSubmit={handleCreate} className="grid md:grid-cols-4 gap-4">
          <input
            type="text"
            required
            placeholder="Full Name"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          />

          <input
            type="email"
            required
            placeholder="staff@college.edu"
            value={createForm.email}
            onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          />

          <select
            value={createForm.role}
            onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            className="border rounded-xl px-4 py-2"
          >
            {ROLES.map(r => (
              <option key={r}>{r}</option>
            ))}
          </select>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: .95 }}
            disabled={creating}
            className="bg-indigo-600 text-white rounded-xl py-2 shadow"
          >
            {creating ? "Creating..." : "Add User"}
          </motion.button>
        </form>
      </motion.div>

      {/* USER LIST */}
      <motion.div className="bg-white/80 backdrop-blur rounded-2xl shadow-xl border overflow-hidden">

        <div className="flex justify-between items-center p-5 border-b">
          <h3 className="font-semibold">Staff List</h3>

          <input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-xl px-4 py-2 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {loading ? (
          <div className="p-10 text-center animate-pulse">Loading...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4 text-left">Name</th>
                <th className="p-4 text-left">Email</th>
                <th className="p-4 text-center">Role</th>
                <th className="p-4 text-center">Application Edit Access</th>
                <th className="p-4 text-center">Toggle</th>
                <th className="p-4 text-center">Update</th>
                <th className="p-4 text-center"></th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, i) => {
                const isAdmin = u.role === "admin";
                const isVerificationOfficer = u.role === "verification_officer";

                return (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * .05 }}
                    className="border-b hover:bg-indigo-50"
                  >
                    <td className="p-4 font-medium">{u.name || "N/A"}</td>
                    <td className="p-4 text-gray-600">{u.email}</td>

                    <td className="text-center p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold
                        ${isAdmin ? "bg-red-100 text-red-700" : "bg-indigo-100 text-indigo-700"}`}>
                        {u.role}
                      </span>
                    </td>

                    {/* NEW: Access Status Column */}
                    <td className="text-center p-4">
                      {isVerificationOfficer ? (
                        <span className={`font-bold ${u.canEditApplication ? "text-green-600" : "text-red-500"}`}>
                          {u.canEditApplication ? "ON" : "OFF"}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    {/* NEW: Toggle Access Button Column */}
                    <td className="text-center p-4">
                      {isVerificationOfficer && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => toggleAccess(u.id)}
                          className={`px-3 py-1 rounded-md text-white text-xs font-semibold transition-colors
                            ${u.canEditApplication ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"}`}
                        >
                          {u.canEditApplication ? "Disable" : "Enable"}
                        </motion.button>
                      )}
                    </td>

                    <td className="text-center p-4">
                      {!isAdmin && (
                        <select
                          value={u.role}
                          onChange={(e) => updateRole(u.id, e.target.value)}
                          className="border rounded px-2 py-1"
                        >
                          {ROLES.map(r => (
                            <option key={r}>{r}</option>
                          ))}
                        </select>
                      )}
                    </td>

                    <td className="text-center p-4">
                      {!isAdmin && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          onClick={() => deleteUser(u.id)}
                          className="text-red-500"
                        >
                          <Trash2 size={16} />
                        </motion.button>
                      )}
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </motion.div>

    </motion.div>
  );
}