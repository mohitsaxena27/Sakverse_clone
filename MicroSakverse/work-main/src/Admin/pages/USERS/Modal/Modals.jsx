import { Dialog } from "@headlessui/react";

const UserModal = ({ isOpen, onClose, newUser, setNewUser, onAddUser, onUpdateUser, isEditing }) => {
  return (
    <Dialog open={isOpen} onClose={onClose} className="fixed inset-0 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-md w-96">
        <h3 className="text-lg font-semibold mb-4">{isEditing ? "Edit User" : "Add New User"}</h3>
        <input type="text" placeholder="Name" className="w-full p-2 border mb-2" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
        <input type="email" placeholder="Email" className="w-full p-2 border mb-2" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
        <input type="text" placeholder="Role" className="w-full p-2 border mb-2" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} />
        <input type="text" placeholder="Project Access (comma separated)" className="w-full p-2 border mb-2" value={newUser.project_access} onChange={(e) => setNewUser({ ...newUser, project_access: e.target.value })} />
        <input type="text" placeholder="Token" className="w-full p-2 border mb-2" value={newUser.token} onChange={(e) => setNewUser({ ...newUser, token: e.target.value })} />
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Cancel</button>
          {isEditing ? (
            <button onClick={onUpdateUser} className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600">Update</button>
          ) : (
            <button onClick={onAddUser} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Add</button>
          )}
        </div>
      </div>
    </Dialog>
  );
};

export default UserModal;
