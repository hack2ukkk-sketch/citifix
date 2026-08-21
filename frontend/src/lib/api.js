const API_BASE_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/$/, "");

export const authStorage = {
  getToken: () => localStorage.getItem("citifix_token"),
  setToken: (token) => localStorage.setItem("citifix_token", token),
  clearToken: () => localStorage.removeItem("citifix_token"),
};

const getAuthHeaders = () => {
  const token = authStorage.getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

// ─── Mock Data Store ──────────────────────────────────────────────────────────
const MOCK_KEY = "citifix_mock_users";
const MOCK_COMPLAINTS_KEY = "citifix_mock_complaints";

const getMockUsers = () => JSON.parse(localStorage.getItem(MOCK_KEY) || "[]");
const saveMockUsers = (users) => localStorage.setItem(MOCK_KEY, JSON.stringify(users));

const getMockComplaints = () => {
  const stored = localStorage.getItem(MOCK_COMPLAINTS_KEY);
  if (stored) return JSON.parse(stored);
  const defaults = [
    { id: 1, title: "Pothole on MG Road", description: "Large pothole causing accidents near junction.", category: "ROADS", status: "PENDING", location: "MG Road, Bengaluru", latitude: 12.9716, longitude: 77.5946, votes: 24, createdAt: new Date(Date.now() - 86400000 * 3).toISOString(), userId: 1, userName: "Ravi Kumar" },
    { id: 2, title: "Broken Street Light", description: "Street light not working for 2 weeks.", category: "ELECTRICITY", status: "IN_PROGRESS", location: "Koramangala 5th Block", latitude: 12.9352, longitude: 77.6245, votes: 18, createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), userId: 2, userName: "Priya Sharma" },
    { id: 3, title: "Garbage not collected", description: "No garbage pickup since last Monday.", category: "SANITATION", status: "RESOLVED", location: "Indiranagar 100ft Road", latitude: 12.9784, longitude: 77.6408, votes: 31, createdAt: new Date(Date.now() - 86400000 * 7).toISOString(), userId: 3, userName: "Anita Desai" },
    { id: 4, title: "Water pipeline leakage", description: "Water leaking on main road causing waterlogging.", category: "WATER", status: "PENDING", location: "Whitefield Main Road", latitude: 12.9698, longitude: 77.7499, votes: 42, createdAt: new Date(Date.now() - 86400000).toISOString(), userId: 1, userName: "Ravi Kumar" },
    { id: 5, title: "Encroachment on footpath", description: "Vendors blocking the footpath completely.", category: "ROADS", status: "IN_PROGRESS", location: "Brigade Road", latitude: 12.9719, longitude: 77.6074, votes: 15, createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), userId: 2, userName: "Priya Sharma" },
  ];
  localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(defaults));
  return defaults;
};
const saveMockComplaints = (c) => localStorage.setItem(MOCK_COMPLAINTS_KEY, JSON.stringify(c));

const mockDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

const IS_DEMO = !import.meta.env.VITE_API_URL;

const mockAuth = {
  async requestOtp(phone) {
    await mockDelay();
    return { devOtp: "123456", message: "OTP sent (Demo: 123456)" };
  },
  async verifyLoginOtp(phone, otp) {
    await mockDelay();
    const users = getMockUsers();
    const user = users.find((u) => u.phone === phone);
    if (!user) throw new Error("No account found. Please register first.");
    if (otp !== "123456") throw new Error("Invalid OTP. Use 123456 for demo.");
    const token = `mock_token_${user.id}_${Date.now()}`;
    return { user, token };
  },
  async registerWithOtp({ name, email, phone, role, otp }) {
    await mockDelay();
    if (otp !== "123456") throw new Error("Invalid OTP. Use 123456 for demo.");
    const users = getMockUsers();
    if (users.find((u) => u.phone === phone)) throw new Error("Account already exists. Please login.");
    const newUser = { id: Date.now(), name, email, phone, role: role.toUpperCase(), points: 0, createdAt: new Date().toISOString() };
    saveMockUsers([...users, newUser]);
    const token = `mock_token_${newUser.id}_${Date.now()}`;
    return { user: newUser, token };
  },
  async me() {
    await mockDelay(100);
    const token = authStorage.getToken();
    if (!token || !token.startsWith("mock_token_")) throw new Error("Not authenticated");
    const id = parseInt(token.split("_")[2]);
    const users = getMockUsers();
    const user = users.find((u) => u.id === id);
    if (!user) throw new Error("User not found");
    return user;
  },
};

const mockComplaints = {
  async list() { await mockDelay(); return getMockComplaints(); },
  async listMine() {
    await mockDelay();
    const token = authStorage.getToken();
    const id = token ? parseInt(token.split("_")[2]) : null;
    return getMockComplaints().filter((c) => c.userId === id);
  },
  async create(payload) {
    await mockDelay(600);
    const complaints = getMockComplaints();
    const token = authStorage.getToken();
    const id = token ? parseInt(token.split("_")[2]) : 1;
    const users = getMockUsers();
    const user = users.find((u) => u.id === id);
    const newC = { id: Date.now(), ...payload, status: "PENDING", votes: 0, createdAt: new Date().toISOString(), userId: id, userName: user?.name || "Demo User" };
    saveMockComplaints([newC, ...complaints]);
    return newC;
  },
  async vote(complaintId) {
    await mockDelay();
    const complaints = getMockComplaints();
    const updated = complaints.map((c) => c.id === Number(complaintId) ? { ...c, votes: (c.votes || 0) + 1 } : c);
    saveMockComplaints(updated);
    return { success: true };
  },
  async update(complaintId, payload) {
    await mockDelay();
    const complaints = getMockComplaints();
    const updated = complaints.map((c) => c.id === Number(complaintId) ? { ...c, ...payload } : c);
    saveMockComplaints(updated);
    return updated.find((c) => c.id === Number(complaintId));
  },
  async heatmap() {
    await mockDelay();
    return getMockComplaints().map((c) => ({ lat: c.latitude, lng: c.longitude, count: c.votes }));
  },
  async resolveWithProof(complaintId) { await mockDelay(); return { success: true }; },
  async challengeResolution(complaintId) { await mockDelay(); return { success: true }; },
};

const mockAnalytics = {
  total: 128, pending: 45, inProgress: 38, resolved: 45,
  byCategory: [
    { category: "ROADS", count: 42 }, { category: "SANITATION", count: 31 },
    { category: "ELECTRICITY", count: 28 }, { category: "WATER", count: 27 },
  ],
  recentComplaints: getMockComplaints().slice(0, 5),
  resolutionRate: 35,
  avgResolutionDays: 4.2,
};

// ─── Real request helper ──────────────────────────────────────────────────────
const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
};

// ─── Smart request: tries real backend, falls back to mock ────────────────────
const smartRequest = async (path, options = {}, mockFn) => {
  if (IS_DEMO) return mockFn();
  try {
    return await request(path, options);
  } catch (err) {
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      return mockFn();
    }
    throw err;
  }
};

// ─── Public API exports ───────────────────────────────────────────────────────
export const authApi = {
  requestOtp: (phone, purpose) =>
    smartRequest("/auth/request-otp", { method: "POST", body: JSON.stringify({ phone, purpose }) },
      () => mockAuth.requestOtp(phone)),

  verifyLoginOtp: (phone, otp) =>
    smartRequest("/auth/login/verify", { method: "POST", body: JSON.stringify({ phone, otp }) },
      () => mockAuth.verifyLoginOtp(phone, otp)),

  registerWithOtp: ({ name, email, phone, role, otp }) =>
    smartRequest("/auth/register", { method: "POST", body: JSON.stringify({ name, email, phone, role, otp }) },
      () => mockAuth.registerWithOtp({ name, email, phone, role, otp })),

  me: () => smartRequest("/auth/me", {}, () => mockAuth.me()),
};

export const complaintsApi = {
  create: (payload) =>
    smartRequest("/complaints", { method: "POST", body: JSON.stringify(payload) },
      () => mockComplaints.create(payload)),

  list: () => smartRequest("/complaints", {}, () => mockComplaints.list()),

  listMine: () => smartRequest("/complaints/user/my-complaints", {}, () => mockComplaints.listMine()),

  vote: (complaintId) =>
    smartRequest(`/complaints/${complaintId}/vote`, { method: "POST" },
      () => mockComplaints.vote(complaintId)),

  update: (complaintId, payload) =>
    smartRequest(`/complaints/${complaintId}`, { method: "PUT", body: JSON.stringify(payload) },
      () => mockComplaints.update(complaintId, payload)),

  heatmap: () => smartRequest("/complaints/heatmap", {}, () => mockComplaints.heatmap()),

  resolveWithProof: (complaintId, resolutionImageUrl) =>
    smartRequest(`/complaints/${complaintId}/resolve-with-proof`, { method: "POST", body: JSON.stringify({ resolutionImageUrl }) },
      () => mockComplaints.resolveWithProof(complaintId)),

  challengeResolution: (complaintId, reason) =>
    smartRequest(`/complaints/${complaintId}/challenge-resolution`, { method: "POST", body: JSON.stringify({ reason }) },
      () => mockComplaints.challengeResolution(complaintId)),
};

export const adminApi = {
  analytics: () => smartRequest("/admin/analytics", {}, async () => { await mockDelay(); return mockAnalytics; }),
  complaints: () => smartRequest("/admin/complaints?limit=500", {}, () => mockComplaints.list()),
  updateStatus: (complaintId, status) =>
    smartRequest(`/admin/complaints/${complaintId}/status`, { method: "PATCH", body: JSON.stringify({ status }) },
      () => mockComplaints.update(complaintId, { status })),
};

export const leaderboardApi = {
  list: () => smartRequest("/leaderboard", {}, async () => {
    await mockDelay();
    return [
      { id: 1, name: "Ravi Kumar", points: 320, complaints: 14, resolved: 12 },
      { id: 2, name: "Priya Sharma", points: 280, complaints: 11, resolved: 9 },
      { id: 3, name: "Anita Desai", points: 250, complaints: 10, resolved: 8 },
      { id: 4, name: "Demo User", points: 190, complaints: 8, resolved: 6 },
      { id: 5, name: "Vikram Nair", points: 160, complaints: 7, resolved: 5 },
    ];
  }),
};

export const superAdminApi = {
  users: () => smartRequest("/superadmin/users", {}, async () => { await mockDelay(); return getMockUsers(); }),
  setRole: (userId, role, department) =>
    smartRequest(`/superadmin/users/${userId}/role`, { method: "PATCH", body: JSON.stringify({ role, department }) },
      async () => { await mockDelay(); return { success: true }; }),
  assignSubAdmin: (complaintId, data) =>
    smartRequest(`/superadmin/complaints/${complaintId}/assign`, { method: "POST", body: JSON.stringify(data) },
      async () => { await mockDelay(); return { success: true }; }),
  unassign: (complaintId) =>
    smartRequest(`/superadmin/complaints/${complaintId}/assign`, { method: "DELETE" },
      async () => { await mockDelay(); return { success: true }; }),
  getSlaConfigs: () => smartRequest("/superadmin/sla", {}, async () => { await mockDelay(); return []; }),
  setSla: (department, days) =>
    smartRequest(`/superadmin/sla/${department}`, { method: "PUT", body: JSON.stringify({ daysToResolve: days }) },
      async () => { await mockDelay(); return { success: true }; }),
  getAnalytics: () => smartRequest("/superadmin/analytics", {}, async () => { await mockDelay(); return mockAnalytics; }),
  getExtensionRequests: () => smartRequest("/superadmin/extension-requests", {}, async () => { await mockDelay(); return []; }),
  reviewExtensionRequest: (id, data) =>
    smartRequest(`/superadmin/extension-requests/${id}`, { method: "PATCH", body: JSON.stringify(data) },
      async () => { await mockDelay(); return { success: true }; }),
  getRaisedIssues: () => smartRequest("/superadmin/raised-issues", {}, async () => { await mockDelay(); return []; }),
  assignRaisedIssue: (id, subAdminId) =>
    smartRequest(`/superadmin/raised-issues/${id}/assign`, { method: "PATCH", body: JSON.stringify({ subAdminId }) },
      async () => { await mockDelay(); return { success: true }; }),
};

export const subAdminApi = {
  myComplaints: () => smartRequest("/subadmin/complaints", {}, () => mockComplaints.list()),
  updateStatus: (complaintId, status) =>
    smartRequest(`/subadmin/complaints/${complaintId}/status`, { method: "PATCH", body: JSON.stringify({ status }) },
      () => mockComplaints.update(complaintId, { status })),
  requestExtension: (complaintId, data) =>
    smartRequest(`/subadmin/complaints/${complaintId}/request-extension`, { method: "POST", body: JSON.stringify(data) },
      async () => { await mockDelay(); return { success: true }; }),
  getExtensionRequests: (complaintId) =>
    smartRequest(`/subadmin/complaints/${complaintId}/extension-requests`, {},
      async () => { await mockDelay(); return []; }),
  raiseIssue: (complaintId, data) =>
    smartRequest(`/subadmin/complaints/${complaintId}/raise-issue`, { method: "POST", body: JSON.stringify(data) },
      async () => { await mockDelay(); return { success: true }; }),
  getAssignedRaisedIssues: () => smartRequest("/subadmin/raised-issues", {}, async () => { await mockDelay(); return []; }),
  resolveRaisedIssue: (id) =>
    smartRequest(`/subadmin/raised-issues/${id}/resolve`, { method: "PATCH" },
      async () => { await mockDelay(); return { success: true }; }),
};

export const bidsApi = {
  create: (data) => smartRequest("/bids", { method: "POST", body: JSON.stringify(data) }, async () => { await mockDelay(); return { id: Date.now(), ...data }; }),
  list: () => smartRequest("/bids", {}, async () => { await mockDelay(); return []; }),
  getProposals: (bidId) => smartRequest(`/bids/${bidId}/proposals`, {}, async () => { await mockDelay(); return []; }),
  award: (bidId, proposalId) => smartRequest(`/bids/${bidId}/award/${proposalId}`, { method: "POST" }, async () => { await mockDelay(); return { success: true }; }),
  cancel: (bidId) => smartRequest(`/bids/${bidId}`, { method: "DELETE" }, async () => { await mockDelay(); return { success: true }; }),
  myDeptBids: () => smartRequest("/bids/my-dept", {}, async () => { await mockDelay(); return []; }),
  submitProposal: (bidId, data) => smartRequest(`/bids/${bidId}/propose`, { method: "POST", body: JSON.stringify(data) }, async () => { await mockDelay(); return { success: true }; }),
  myProposal: (bidId) => smartRequest(`/bids/${bidId}/my-proposal`, {}, async () => { await mockDelay(); return null; }),
};

export const chatApi = {
  sendMessage: (message, history = []) =>
    smartRequest("/chat", { method: "POST", body: JSON.stringify({ message, history }) },
      async () => {
        await mockDelay(800);
        return { reply: `Demo mode: I received your message "${message}". The AI chatbot requires a live backend connection to function fully.` };
      }),
  generateDescription: (title) =>
    smartRequest("/chat/generate-description", { method: "POST", body: JSON.stringify({ title }) },
      async () => {
        await mockDelay(600);
        return { description: `This complaint regarding "${title}" requires immediate attention from the civic authorities to ensure public safety and convenience.` };
      }),
};

export const dashboardApi = {
  analytics: () => smartRequest("/dashboard/analytics", {}, async () => { await mockDelay(); return mockAnalytics; }),
};

export const notificationsApi = {
  list: (page = 1, limit = 20) => smartRequest(`/notifications?page=${page}&limit=${limit}`, {}, async () => { await mockDelay(); return { notifications: [], total: 0 }; }),
  unreadCount: () => smartRequest("/notifications/unread-count", {}, async () => { await mockDelay(); return { count: 0 }; }),
  markRead: (id) => smartRequest(`/notifications/${id}/read`, { method: "PATCH" }, async () => { await mockDelay(); return { success: true }; }),
  markAllRead: () => smartRequest("/notifications/read-all", { method: "PATCH" }, async () => { await mockDelay(); return { success: true }; }),
};

export const twoFactorApi = {
  setup: () => smartRequest("/auth/2fa/setup", { method: "POST" }, async () => { await mockDelay(); return { secret: "DEMO_SECRET", qrCode: "" }; }),
  verifySetup: (token) => smartRequest("/auth/2fa/verify-setup", { method: "POST", body: JSON.stringify({ token }) }, async () => { await mockDelay(); return { success: true }; }),
  verifySetupLogin: (tempToken, token) => smartRequest("/auth/2fa/verify-setup-login", { method: "POST", body: JSON.stringify({ tempToken, token }) }, async () => { await mockDelay(); return { success: true }; }),
  verifyLogin: (tempToken, token) => smartRequest("/auth/2fa/verify-login", { method: "POST", body: JSON.stringify({ tempToken, token }) }, async () => { await mockDelay(); return { success: true }; }),
  disable: (token) => smartRequest("/auth/2fa/disable", { method: "POST", body: JSON.stringify({ token }) }, async () => { await mockDelay(); return { success: true }; }),
  status: () => smartRequest("/auth/2fa/status", {}, async () => { await mockDelay(); return { enabled: false }; }),
};
