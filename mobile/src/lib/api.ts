import * as SecureStore from "expo-secure-store";
import { getApiUrl } from "./getApiUrl";

export type UserRole = "admin" | "teacher" | "student" | "parent";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  createdAt?: string;
  lastLogin?: string;
};

export type StudentProfile = {
  _id: string;
  dateOfBirth?: string;
  address?: string;
  parentName?: string;
  parentPhone?: string;
  aadhaarNumber?: string;
  admissionDate?: string;
  course?: { _id: string; name: string };
  batch?: { _id: string; name: string };
  teacher?: { _id: string; name: string; email?: string; phone?: string };
  feesStatus?: string;
  totalFees?: number;
  paidFees?: number;
  performanceScore?: number;
  attendancePercent?: number;
  streak?: number;
  badges?: string[];
  xp?: number;
  level?: number;
};

export type FeedbackCategory =
  | "general"
  | "course"
  | "teacher"
  | "facilities"
  | "app"
  | "fees"
  | "other";

export type ContactStatus = "new" | "contacted" | "resolved";

export type Feedback = {
  _id: string;
  category: FeedbackCategory;
  rating?: number;
  subject?: string;
  message: string;
  isTestimonial?: boolean;
  approvedForHomepage?: boolean;
  isContactInquiry?: boolean;
  student?: { name: string; avatar?: string };
  contact?: { name: string; email: string; phone: string; status: ContactStatus };
  createdAt: string;
};

export type PublicTestimonial = {
  _id: string;
  message: string;
  rating: number;
  student: { name: string; avatar?: string };
  createdAt: string;
};

export type AnnouncementAuthor = { _id: string; name: string; avatar?: string; role?: string };

export type AnnouncementComment = {
  _id: string;
  user: AnnouncementAuthor;
  text: string;
  createdAt: string;
};

export type AnnouncementPollOption = {
  _id: string;
  text: string;
  voteCount: number;
  votedByMe: boolean;
};

export type Announcement = {
  _id: string;
  author: AnnouncementAuthor;
  type: "text" | "image" | "poll";
  caption?: string;
  imageUrl?: string;
  pollOptions?: AnnouncementPollOption[];
  pollEndsAt?: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  myPollVoteIndex: number;
  comments: AnnouncementComment[];
  createdAt: string;
};

export type TeacherProfile = {
  _id: string;
  qualification?: string;
  experience?: string;
  joiningDate?: string;
  subjects?: string[];
  batches?: { _id: string; name: string; timing?: string; type?: string }[];
  rating?: number;
  performanceScore?: number;
};

export type LevelInfo = {
  level: number;
  current: number;
  needed: number;
  total: number;
};

export type ShorthandDictation = {
  _id: string;
  title: string;
  audioUrl: string;
  transcript?: string;
  targetWpm: number;
  durationSeconds: number;
  batch?: { _id: string; name: string };
  course?: { _id: string; title?: string; name?: string };
  uploadedBy?: { _id: string; name: string };
  createdAt: string;
};

export type ShorthandMistake = {
  word: string;
  expected: string;
  typed: string;
  index: number;
};

export type TypingPassage = {
  _id: string;
  title: string;
  content: string;
  language: "english" | "hindi";
  wordCount: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  isAiGenerated: boolean;
  createdAt: string;
};

export type TypingErrorKey = { key: string; count: number };

export type TypingSession = {
  _id: string;
  wpm: number;
  accuracy: number;
  language?: string;
  durationSeconds?: number;
  errorKeys?: TypingErrorKey[];
  practicedAt: string;
  passage?: { _id: string; title: string; language?: string; difficulty?: string };
};

export type TypingAnalysis = {
  sessions: TypingSession[];
  insights: string;
  context: {
    avgWpm: number;
    avgAccuracy: number;
    errorKeys: TypingErrorKey[];
  };
  source: string;
};

export type ExamQuestion = {
  question: string;
  options?: string[];
  correctAnswer?: string;
  marks?: number;
  dictationAudio?: string;
  targetWpm?: number;
};

export type Exam = {
  _id: string;
  title: string;
  type: string;
  questionType: "mcq" | "typing" | "shorthand" | "practical";
  scheduledAt: string;
  duration: number;
  totalMarks: number;
  questions: ExamQuestion[];
  isPublished?: boolean;
  isTimed?: boolean;
  course?: { _id: string; name: string };
  batch?: { _id: string; name: string };
};

export type ExamEvaluationRoster = {
  student: { _id: string; name: string; email?: string };
  status: "present" | "absent" | "in_progress";
  score: number | null;
  wpm: number | null;
  accuracy: number | null;
  submittedAt: string | null;
  rank: number | null;
};

export type ExamAttempt = {
  _id: string;
  exam: Exam | string;
  student: string;
  startedAt: string;
  submittedAt?: string;
  score?: number;
  wpm?: number;
  accuracy?: number;
  status: "in_progress" | "evaluated";
  timeTakenSeconds?: number;
  analysis?: string;
  answers?: {
    questionIndex: number;
    answer?: string;
    typedText?: string;
    isCorrect?: boolean;
    marks?: number;
    wpm?: number;
    accuracy?: number;
  }[];
};

export type LeaderboardEntry = {
  rank: number;
  studentId: string;
  name: string;
  avatar?: string;
  level: number;
  xp: number;
  badges?: string[];
  streak: number;
  periodXp: number;
  avgWpm: number;
  avgAccuracy: number;
  sessions: number;
};

export type Fee = {
  _id: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  student?: string;
};

export type UpiDetails = {
  upiId: string;
  merchantName: string;
  amount: number;
  currency: string;
  note: string;
  upiUrl: string;
  feeId: string;
  studentId: string;
};

export type Pagination = { page: number; limit: number; total: number; pages: number };

export type LibraryItem = {
  _id: string;
  title: string;
  description?: string;
  type: string;
  category: string;
  url: string;
  visibility?: "public" | "course";
  tags?: string[];
  course?: { _id: string; name: string };
  batch?: { _id: string; name: string };
  teacher?: { _id: string; name: string };
  uploadedBy?: { _id: string; name: string };
};

export type LibraryListResponse = { items: LibraryItem[]; pagination: Pagination };

export type AttendanceRecord = {
  _id: string;
  student?: { _id: string; name: string; email?: string };
  batch?: { _id: string; name: string };
  date: string;
  status: string;
  method: string;
  markedBy?: { _id: string; name: string; role?: string };
  createdAt?: string;
};

export type LiveClassParticipant = {
  user: { _id: string; name: string; avatar?: string; role?: string };
  status: "waiting" | "admitted" | "kicked";
  handRaised: boolean;
  isMuted: boolean;
  joinedAt?: string;
};

export type LiveClassChatMessage = {
  _id: string;
  user: { _id: string; name: string; avatar?: string; role?: string };
  text: string;
  createdAt: string;
};

export type LiveClassSession = {
  _id: string;
  title: string;
  description?: string;
  batch?: { _id: string; name: string };
  teacher: { _id: string; name: string; avatar?: string };
  roomId: string;
  status: "scheduled" | "live" | "ended";
  scheduledAt: string;
  duration: number;
  waitingRoomEnabled: boolean;
  chatEnabled: boolean;
  handRaiseEnabled: boolean;
  screenShareEnabled: boolean;
  sessionParticipants: LiveClassParticipant[];
  chatMessages: LiveClassChatMessage[];
  participantCount?: number;
  waitingCount?: number;
};

export type AttendanceStats = {
  total: number;
  present: number;
  absent: number;
  late: number;
  leave: number;
};

export type Payment = {
  _id: string;
  amount: number;
  status: "pending" | "approved" | "rejected";
  utr: string;
  screenshotUrl?: string;
  screenshotPublicId?: string;
  receiptNumber?: string;
  rejectionReason?: string;
  createdAt: string;
  fee?: Fee;
  student?: { _id: string; name: string; email?: string; phone?: string };
};

export type ParentChild = {
  student: { _id: string; name: string; email: string; phone?: string; avatar?: string };
  relationship: string;
  profile?: Record<string, unknown>;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
};

async function getToken() {
  return SecureStore.getItemAsync("token");
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const apiUrl = getApiUrl();

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      ...options,
    });
  } catch {
    throw new Error(`Cannot reach backend at ${apiUrl}`);
  }

  const result: ApiResponse<T> = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Request failed");
  }
  return result.data;
}

async function uploadFile(uri: string, name: string, mimeType: string, folder = "materials") {
  const token = await getToken();
  const apiUrl = getApiUrl();
  const formData = new FormData();
  formData.append("file", { uri, name, type: mimeType } as unknown as Blob);
  formData.append("folder", folder);

  const response = await fetch(`${apiUrl}/upload`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || "Upload failed");
  return result.data as { url: string; publicId?: string };
}

export function getRolePath(role: UserRole) {
  return `/${role}`;
}

export const api = {
  getBaseUrl: getApiUrl,
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  getMe: () => request<{ user: User; profile: StudentProfile | TeacherProfile | null }>("/auth/me"),
  updateProfile: (data: { avatar: string }) =>
    request<{ user: User }>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  changePassword: (data: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
    request<{ message: string }>("/auth/change-password", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  adminDashboard: () => request<Record<string, unknown>>("/admin/dashboard"),
  adminStudents: (params?: string) =>
    request<Record<string, unknown>>(`/admin/students${params ? `?${params}` : ""}`),
  adminTeachers: (params?: string) =>
    request<Record<string, unknown>>(`/admin/teachers${params ? `?${params}` : ""}`),
  createStudent: (data: Record<string, unknown>) =>
    request<unknown>("/admin/students", { method: "POST", body: JSON.stringify(data) }),
  updateStudent: (userId: string, data: Record<string, unknown>) =>
    request<unknown>(`/admin/students/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  archiveStudent: (userId: string) =>
    request<unknown>(`/admin/students/${userId}`, { method: "DELETE" }),
  adminDatabase: (params?: string) =>
    request<Record<string, unknown>>(`/admin/database${params ? `?${params}` : ""}`),
  getPersonRecord: (userId: string) =>
    request<Record<string, unknown>>(`/admin/records/${userId}`),
  createTeacher: (data: Record<string, unknown>) =>
    request<unknown>("/admin/teachers", { method: "POST", body: JSON.stringify(data) }),
  updateTeacher: (userId: string, data: Record<string, unknown>) =>
    request<unknown>(`/admin/teachers/${userId}`, { method: "PUT", body: JSON.stringify(data) }),
  archiveTeacher: (userId: string) =>
    request<unknown>(`/admin/teachers/${userId}`, { method: "DELETE" }),
  teacherDashboard: () => request<Record<string, unknown>>("/teacher/dashboard"),
  getStudentReport: (studentId: string) =>
    request<Record<string, unknown>>(`/teacher/students/${studentId}/report`),
  getAttendanceMarkList: (batchId?: string) =>
    request<Record<string, unknown>>(`/attendance/mark-list${batchId ? `?batchId=${batchId}` : ""}`),
  studentDashboard: () => request<Record<string, unknown>>("/student/dashboard"),
  getCourses: (params?: string) =>
    request<unknown[] | { courses: unknown[]; pagination: Pagination }>(`/courses${params ? `?${params}` : ""}`),
  getCourseCategories: () => request<string[]>("/courses/categories"),
  createCourse: (data: Record<string, unknown>) =>
    request<unknown>("/courses", { method: "POST", body: JSON.stringify(data) }),
  deleteCourse: (id: string) =>
    request<unknown>(`/courses/${id}`, { method: "DELETE" }),
  deleteArchivedRecord: (userId: string) =>
    request<unknown>(`/admin/records/${userId}`, { method: "DELETE" }),
  getBatches: (params?: string) =>
    request<unknown[] | { batches: unknown[]; pagination: Pagination }>(`/batches${params ? `?${params}` : ""}`),
  createBatch: (data: Record<string, unknown>) =>
    request<unknown>("/batches", { method: "POST", body: JSON.stringify(data) }),
  deleteBatch: (id: string) =>
    request<unknown>(`/batches/${id}`, { method: "DELETE" }),
  getFees: (params?: string) =>
    request<Fee[] | { fees: Fee[]; pagination: Pagination }>(`/fees${params ? `?${params}` : ""}`),
  createFee: (data: Record<string, unknown>) =>
    request<unknown>("/fees", { method: "POST", body: JSON.stringify(data) }),
  recordPayment: (feeId: string, data: Record<string, unknown>) =>
    request<unknown>(`/fees/${feeId}/pay`, { method: "POST", body: JSON.stringify(data) }),
  getExams: (params?: string) =>
    request<Exam[] | { exams: Exam[]; pagination: Pagination }>(`/exams${params ? `?${params}` : ""}`),
  getExam: (id: string) => request<Exam>(`/exams/${id}`),
  createExam: (data: Record<string, unknown>) =>
    request<Exam>("/exams", { method: "POST", body: JSON.stringify(data) }),
  updateExam: (id: string, data: Record<string, unknown>) =>
    request<Exam>(`/exams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteExam: (id: string) =>
    request<unknown>(`/exams/${id}`, { method: "DELETE" }),
  getExamEvaluation: (id: string) =>
    request<{ exam: Exam; roster: ExamEvaluationRoster[]; stats: { total: number; present: number; absent: number; inProgress: number } }>(
      `/exams/${id}/evaluation`
    ),
  startExam: (id: string) => request<ExamAttempt>(`/exams/${id}/start`, { method: "POST" }),
  submitExam: (id: string, answers: { questionIndex: number; answer?: string; typedText?: string; durationSeconds?: number }[]) =>
    request<{ attempt: ExamAttempt; rank?: number }>(`/exams/${id}/submit`, {
      method: "POST",
      body: JSON.stringify({ answers }),
    }),
  getMyExamAttempts: (examId?: string) =>
    request<ExamAttempt[]>(`/exams/my-attempts${examId ? `?examId=${examId}` : ""}`),
  getAttendance: (params?: string) =>
    request<AttendanceRecord[] | { records: AttendanceRecord[]; pagination: Pagination; stats: AttendanceStats }>(
      `/attendance${params ? `?${params}` : ""}`
    ),
  exportAttendanceCsv: async (params: string) => {
    const token = await getToken();
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/attendance/export?${params}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error((err as { message?: string }).message || "Export failed");
    }
    return response.text();
  },
  markBulkAttendance: (data: Record<string, unknown>) =>
    request<unknown>("/attendance/bulk", { method: "POST", body: JSON.stringify(data) }),
  getNotifications: () =>
    request<{ notifications: unknown[]; unreadCount: number }>("/notifications"),
  dismissNotification: (id: string) =>
    request<unknown>(`/notifications/${id}/read`, { method: "PUT" }),
  markAllNotificationsRead: () =>
    request<unknown>("/notifications/read-all", { method: "PUT" }),

  getAnnouncements: (page = 1, limit = 6) =>
    request<{ announcements: Announcement[]; pagination: { page: number; pages: number; total: number } }>(
      `/announcements?page=${page}&limit=${limit}`
    ),
  createAnnouncement: (data: Record<string, unknown>) =>
    request<Announcement>("/announcements", { method: "POST", body: JSON.stringify(data) }),
  deleteAnnouncement: (id: string) =>
    request<unknown>(`/announcements/${id}`, { method: "DELETE" }),
  likeAnnouncement: (id: string) =>
    request<{ liked: boolean; likeCount: number }>(`/announcements/${id}/like`, { method: "POST" }),
  voteAnnouncementPoll: (id: string, optionIndex: number) =>
    request<Announcement>(`/announcements/${id}/vote`, {
      method: "POST",
      body: JSON.stringify({ optionIndex }),
    }),
  commentOnAnnouncement: (id: string, text: string) =>
    request<{ comment: AnnouncementComment; commentCount: number }>(`/announcements/${id}/comments`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  deleteAnnouncementComment: (id: string, commentId: string) =>
    request<{ commentCount: number }>(`/announcements/${id}/comments/${commentId}`, { method: "DELETE" }),

  submitFeedback: (data: {
    category: FeedbackCategory;
    rating?: number;
    subject?: string;
    message: string;
    isTestimonial?: boolean;
  }) =>
    request<Feedback>("/feedback", { method: "POST", body: JSON.stringify(data) }),
  getAdminFeedback: (params?: string) =>
    request<{
      feedback: Feedback[];
      pagination: { page: number; pages: number; total: number };
      stats: {
        total: number;
        avgRating: number | null;
        byCategory: Record<string, number>;
        approvedTestimonials: number;
        maxHomepageTestimonials: number;
        newContactInquiries: number;
      };
    }>(`/feedback${params ? `?${params}` : ""}`),
  updateContactStatus: (id: string, status: ContactStatus) =>
    request<Feedback>(`/feedback/${id}/contact-status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getPublicTestimonials: () =>
    request<{ testimonials: PublicTestimonial[] }>("/feedback/public/testimonials"),
  submitContactInquiry: (data: {
    name: string;
    email: string;
    phone: string;
    subject?: string;
    message: string;
  }) =>
    request<Feedback>("/feedback/public/contact", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  toggleTestimonialApproval: (id: string, approved: boolean) =>
    request<Feedback>(`/feedback/${id}/homepage`, {
      method: "PATCH",
      body: JSON.stringify({ approved }),
    }),
  deleteFeedback: (id: string) =>
    request<unknown>(`/feedback/${id}`, { method: "DELETE" }),

  registerDeviceToken: (token: string, platform: string) =>
    request<unknown>("/notifications/device-token", {
      method: "POST",
      body: JSON.stringify({ token, platform }),
    }),
  removeDeviceToken: (token: string) =>
    request<unknown>("/notifications/device-token", {
      method: "DELETE",
      body: JSON.stringify({ token }),
    }),
  getLibrary: (params?: string) =>
    request<LibraryItem[] | LibraryListResponse>(`/library${params ? `?${params}` : ""}`),
  addLibraryItem: (data: Record<string, unknown>) =>
    request<LibraryItem>("/library", { method: "POST", body: JSON.stringify(data) }),
  deleteLibraryItem: (id: string) =>
    request<unknown>(`/library/${id}`, { method: "DELETE" }),
  getCertificates: () => request<unknown[]>("/certificates"),
  issueCertificate: (data: Record<string, unknown>) =>
    request<unknown>("/certificates", { method: "POST", body: JSON.stringify(data) }),
  verifyCertificate: (id: string) => request<unknown>(`/certificates/verify/${id}`),
  getCertificateRenderUrl: async (certificateId: string) => {
    const token = await getToken();
    const base = `${getApiUrl()}/certificates/render/${certificateId}`;
    return token ? `${base}?token=${encodeURIComponent(token)}` : base;
  },
  getCertificationPrograms: () => request<unknown[]>("/certifications"),
  getCertificationProgram: (id: string) => request<Record<string, unknown>>(`/certifications/${id}`),
  createCertificationProgram: (data: Record<string, unknown>) =>
    request<unknown>("/certifications", { method: "POST", body: JSON.stringify(data) }),
  updateCertificationProgram: (id: string, data: Record<string, unknown>) =>
    request<unknown>(`/certifications/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteCertificationProgram: (id: string) =>
    request<unknown>(`/certifications/${id}`, { method: "DELETE" }),
  startCertificationExam: (programId: string) =>
    request<Record<string, unknown>>(`/certifications/${programId}/start-exam`, { method: "POST" }),
  submitCertificationExam: (programId: string, attemptId: string, answers: { questionIndex: number; answer: string }[]) =>
    request<Record<string, unknown>>(`/certifications/${programId}/submit-exam`, {
      method: "POST",
      body: JSON.stringify({ attemptId, answers }),
    }),
  getLiveClasses: (status?: string) =>
    request<LiveClassSession[]>(`/live-classes${status ? `?status=${status}` : ""}`),
  getLiveClass: (id: string) => request<LiveClassSession>(`/live-classes/${id}`),
  scheduleLiveClass: (data: Record<string, unknown>) =>
    request<LiveClassSession>("/live-classes/schedule", { method: "POST", body: JSON.stringify(data) }),
  startLiveClass: (data: Record<string, unknown>) =>
    request<LiveClassSession>("/live-classes/start", { method: "POST", body: JSON.stringify(data) }),
  goLiveClass: (id: string) =>
    request<LiveClassSession>(`/live-classes/${id}/go-live`, { method: "POST" }),
  endLiveClass: (id: string) =>
    request<LiveClassSession>(`/live-classes/${id}/end`, { method: "POST" }),
  deleteLiveClass: (id: string) =>
    request<unknown>(`/live-classes/${id}`, { method: "DELETE" }),
  joinLiveClass: (roomId: string) =>
    request<LiveClassSession>(`/live-classes/join/${roomId}`, { method: "POST" }),
  requestJoinLiveClass: (id: string) =>
    request<LiveClassSession>(`/live-classes/${id}/join`, { method: "POST" }),
  admitLiveParticipant: (classId: string, userId: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/admit/${userId}`, { method: "POST" }),
  kickLiveParticipant: (classId: string, userId: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/kick/${userId}`, { method: "POST" }),
  blockLiveParticipant: (classId: string, userId: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/block/${userId}`, { method: "POST" }),
  sendLiveClassChat: (classId: string, text: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/chat`, {
      method: "POST",
      body: JSON.stringify({ text }),
    }),
  toggleLiveHandRaise: (classId: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/hand-raise`, { method: "POST" }),
  muteLiveParticipant: (classId: string, userId: string) =>
    request<LiveClassSession>(`/live-classes/${classId}/mute/${userId}`, { method: "POST" }),
  askCoach: (question: string, context?: string) =>
    request<{ answer: string }>("/ai/coach", {
      method: "POST",
      body: JSON.stringify({ question, context }),
    }),
  generateExamQuestions: (data: {
    topic: string;
    count?: number;
    questionType?: "mcq" | "typing" | "shorthand";
    difficulty?: string;
    courseName?: string;
  }) =>
    request<{ questions: ExamQuestion[]; questionType: string }>("/ai/generate-questions", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  saveTypingPractice: (
    wpm: number,
    accuracy: number,
    language: string,
    durationSeconds?: number,
    passageId?: string,
    errorKeys?: TypingErrorKey[]
  ) =>
    request<Record<string, unknown>>("/student/typing-practice", {
      method: "POST",
      body: JSON.stringify({ wpm, accuracy, language, durationSeconds, passageId, errorKeys }),
    }),

  getTypingPassages: (params?: { language?: string; difficulty?: string }) => {
    const query = new URLSearchParams();
    if (params?.language) query.set("language", params.language);
    if (params?.difficulty) query.set("difficulty", params.difficulty);
    const qs = query.toString();
    return request<TypingPassage[]>(`/typing/passages${qs ? `?${qs}` : ""}`);
  },
  createTypingPassage: (data: Record<string, unknown>) =>
    request<TypingPassage>("/typing/passages", { method: "POST", body: JSON.stringify(data) }),
  generateTypingPassage: (data: {
    language: string;
    topic?: string;
    difficulty?: string;
    targetWords?: number;
  }) =>
    request<{ title: string; content: string; wordCount: number }>("/typing/passages/generate", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteTypingPassage: (id: string) =>
    request<unknown>(`/typing/passages/${id}`, { method: "DELETE" }),
  getTypingSessions: (limit = 5) =>
    request<TypingSession[]>(`/typing/sessions?limit=${limit}`),
  getTypingAnalysis: () => request<TypingAnalysis>("/typing/analyze"),

  // Shorthand
  getDictations: (params?: string) =>
    request<ShorthandDictation[]>(`/shorthand${params ? `?${params}` : ""}`),
  getDictation: (id: string) => request<ShorthandDictation>(`/shorthand/${id}`),
  createDictation: (data: Record<string, unknown>) =>
    request<ShorthandDictation>("/shorthand", { method: "POST", body: JSON.stringify(data) }),
  updateDictation: (id: string, data: Record<string, unknown>) =>
    request<ShorthandDictation>(`/shorthand/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDictation: (id: string) =>
    request<unknown>(`/shorthand/${id}`, { method: "DELETE" }),
  submitDictationAttempt: (id: string, typedText: string, durationSeconds: number) =>
    request<{
      attempt: unknown;
      evaluation: {
        accuracy: number;
        wpm: number;
        mistakes: ShorthandMistake[];
        insights: string;
        improvementFromPrevious: number;
      };
      gamification: {
        xpEarned: number;
        level: number;
        streak: number;
        newBadges: string[];
        levelInfo: LevelInfo;
      } | null;
    }>(`/shorthand/${id}/attempt`, {
      method: "POST",
      body: JSON.stringify({ typedText, durationSeconds }),
    }),
  getShorthandAttempts: (dictationId?: string) =>
    request<unknown[]>(`/shorthand/attempts${dictationId ? `?dictationId=${dictationId}` : ""}`),
  getShorthandProgress: () =>
    request<Record<string, unknown>>("/shorthand/progress"),

  // Gamification
  getLeaderboard: (params?: { period?: string; scope?: string; scopeId?: string }) => {
    const query = new URLSearchParams();
    if (params?.period) query.set("period", params.period);
    if (params?.scope) query.set("scope", params.scope);
    if (params?.scopeId) query.set("scopeId", params.scopeId);
    const qs = query.toString();
    return request<LeaderboardEntry[]>(`/gamification/leaderboard${qs ? `?${qs}` : ""}`);
  },
  getAchievements: () =>
    request<{ badges: string[]; allBadges: { id: string; earned: boolean }[]; streak: number; level: number; xp: number }>(
      "/gamification/achievements"
    ),
  getMyStats: () => request<Record<string, unknown>>("/gamification/my-stats"),

  // Analytics
  getStudentAnalytics: (days = 30) =>
    request<Record<string, unknown>>(`/analytics/student?days=${days}`),
  getHeatmap: (days = 90) =>
    request<{ practice: Record<string, number>; attendance: Record<string, string> }>(
      `/analytics/heatmap?days=${days}`
    ),
  getAiInsights: () =>
    request<{ insights: string; context?: string }>("/analytics/insights"),
  getBatchComparison: (batchId: string) =>
    request<LeaderboardEntry[]>(`/analytics/batch/${batchId}/comparison`),

  // Payments (UPI)
  getUpiDetails: (feeId: string) =>
    request<UpiDetails>(`/payments/upi-details?feeId=${feeId}`),
  submitPaymentProof: (data: { feeId: string; amount: number; utr: string; screenshotUrl: string; screenshotPublicId?: string }) =>
    request<Payment>("/payments/verify", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getPaymentHistory: (status?: string) =>
    request<Payment[]>(`/payments/history${status ? `?status=${status}` : ""}`),
  getAdminPaymentHistory: (params?: string) =>
    request<{ payments: Payment[]; pagination: Pagination }>(
      `/payments/history${params ? `?${params}` : ""}`
    ),
  getPendingPayments: (params?: string) =>
    request<Payment[] | { payments: Payment[]; pagination: Pagination }>(
      `/payments/pending${params ? `?${params}` : ""}`
    ),
  approvePayment: (paymentId: string) =>
    request<Payment>(`/payments/${paymentId}/approve`, { method: "POST" }),
  rejectPayment: (paymentId: string, reason?: string) =>
    request<Payment>(`/payments/${paymentId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  // Parent
  getParentChildren: () => request<ParentChild[]>("/parent/children"),
  getChildDashboard: (studentId: string) =>
    request<Record<string, unknown>>(`/parent/children/${studentId}/dashboard`),
  getChildAttendance: (studentId: string, limit = 90) =>
    request<unknown[]>(`/parent/children/${studentId}/attendance?limit=${limit}`),
  getChildFees: (studentId: string) =>
    request<{ fees: Fee[]; summary: Record<string, unknown> }>(`/parent/children/${studentId}/fees`),
  getChildScores: (studentId: string) =>
    request<ExamAttempt[]>(`/parent/children/${studentId}/scores`),
  getChildCertificates: (studentId: string) =>
    request<unknown[]>(`/parent/children/${studentId}/certificates`),

  uploadFile,
  uploadAudio: (uri: string, name: string, mimeType: string) => uploadFile(uri, name, mimeType, "dictations"),
  uploadPaymentProof: (uri: string, name: string, mimeType: string) =>
    uploadFile(uri, name, mimeType, "payment-proofs"),
  uploadAvatar: (uri: string, name: string, mimeType: string) =>
    uploadFile(uri, name, mimeType, "avatars"),
  uploadAnnouncementImage: (uri: string, name: string, mimeType: string) =>
    uploadFile(uri, name, mimeType, "announcements"),
};

export const auth = {
  saveToken: (token: string) => SecureStore.setItemAsync("token", token),
  removeToken: () => SecureStore.deleteItemAsync("token"),
  getToken,
  savePushToken: (token: string) => SecureStore.setItemAsync("pushToken", token),
  getPushToken: () => SecureStore.getItemAsync("pushToken"),
  removePushToken: () => SecureStore.deleteItemAsync("pushToken"),
};