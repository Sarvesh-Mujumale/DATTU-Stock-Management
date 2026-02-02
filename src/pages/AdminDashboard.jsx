/**
 * Admin Dashboard
 * ================
 * Admin panel for managing users.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

// Create User Modal
const CreateUserModal = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'user'
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await onSubmit(formData);
            setFormData({ username: '', email: '', password: '', role: 'user' });
            onClose();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in">
            <div className="glass-card rounded-3xl p-8 w-full max-w-md animate-slide-up">
                <h3 className="text-2xl font-bold text-neutral-800 mb-6">Create New User</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Username</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter username"
                            required
                            minLength={3}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter email"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Enter password (min 6 chars)"
                            required
                            minLength={6}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                        <select
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            className="w-full px-4 py-3 bg-white/50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-6 bg-neutral-100 text-neutral-700 rounded-xl font-medium hover:bg-neutral-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-3 px-6 btn-primary rounded-xl font-medium"
                        >
                            {loading ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// User Card Component
const UserCard = ({ user, onDelete, onToggleActive, currentUsername }) => {
    const isCurrentUser = user.username === currentUsername;

    return (
        <div className="glass-card rounded-2xl p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="relative">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg
                        ${user.role === 'admin' ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-primary-500 to-primary-600'}`}>
                        {user.username[0].toUpperCase()}
                    </div>
                    {/* Online/Offline indicator */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white
                        ${user.is_logged_in ? 'bg-green-500' : 'bg-gray-300'}`}
                        title={user.is_logged_in ? 'Currently logged in' : 'Offline'} />
                </div>
                <div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-neutral-800">{user.username}</h4>
                        {user.role === 'admin' && (
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                                Admin
                            </span>
                        )}
                        {!user.is_active && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                Disabled
                            </span>
                        )}
                        {user.is_logged_in && (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                                Online
                            </span>
                        )}
                        {isCurrentUser && (
                            <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-medium rounded-full">
                                You
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-neutral-500">{user.email}</p>
                </div>
            </div>

            {!isCurrentUser && (
                <div className="flex items-center gap-2 flex-wrap">
                    <button
                        onClick={() => onToggleActive(user.username)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all
                            ${user.is_active
                                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                                : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                    >
                        {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                        onClick={() => onDelete(user.username)}
                        className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 transition-all"
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};

export default function AdminDashboard() {
    const { user, getUsers, createUser, deleteUser, toggleUserActive } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const fetchUsers = useCallback(async () => {
        try {
            const data = await getUsers();
            setUsers(data);
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        } finally {
            setLoading(false);
        }
    }, [getUsers]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleCreateUser = async (userData) => {
        await createUser(userData);
        setMessage({ type: 'success', text: 'User created successfully!' });
        fetchUsers();
    };

    const handleDeleteUser = async (username) => {
        if (!window.confirm(`Are you sure you want to delete user "${username}"?`)) return;

        try {
            await deleteUser(username);
            setMessage({ type: 'success', text: `User "${username}" deleted successfully!` });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    const handleToggleActive = async (username) => {
        try {
            const result = await toggleUserActive(username);
            setMessage({ type: 'success', text: result.message });
            fetchUsers();
        } catch (err) {
            setMessage({ type: 'error', text: err.message });
        }
    };

    // Clear message after 5 seconds
    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ type: '', text: '' }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gradient">User Management</h2>
                    <p className="text-neutral-500 mt-1">Manage system users and permissions</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn-primary py-3 px-6 rounded-xl font-medium flex items-center gap-2"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add User
                </button>
            </div>

            {/* Message */}
            {message.text && (
                <div className={`p-4 rounded-xl animate-fade-in ${message.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-700'
                    : 'bg-red-50 border border-red-200 text-red-700'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="glass-card rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-gradient">{users.length}</p>
                    <p className="text-neutral-500 text-sm mt-1">Total Users</p>
                </div>
                <div className="glass-card rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-amber-600">{users.filter(u => u.role === 'admin').length}</p>
                    <p className="text-neutral-500 text-sm mt-1">Admins</p>
                </div>
                <div className="glass-card rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-green-600">{users.filter(u => u.is_active).length}</p>
                    <p className="text-neutral-500 text-sm mt-1">Active</p>
                </div>
                <div className="glass-card rounded-2xl p-5 text-center">
                    <p className="text-3xl font-bold text-blue-600">{users.filter(u => u.is_logged_in).length}</p>
                    <p className="text-neutral-500 text-sm mt-1">Online</p>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {loading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
                        <p className="text-neutral-500 mt-4">Loading users...</p>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-neutral-500">No users found</p>
                    </div>
                ) : (
                    users.map(u => (
                        <UserCard
                            key={u.id}
                            user={u}
                            currentUsername={user?.username}
                            onDelete={handleDeleteUser}
                            onToggleActive={handleToggleActive}
                        />
                    ))
                )}
            </div>

            {/* Create User Modal */}
            <CreateUserModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateUser}
            />
        </div>
    );
}
